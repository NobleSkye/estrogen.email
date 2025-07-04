from fastapi import FastAPI, Form, Depends, Request, status, HTTPException, Cookie
from fastapi.responses import HTMLResponse, RedirectResponse
from fastapi.templating import Jinja2Templates
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from database import SessionLocal, User, Email
from passlib.hash import bcrypt
import smtplib
from email.mime.text import MIMEText
import os
import secrets
from typing import Optional

app = FastAPI(title="estrogen.email", description="Email forwarding service")

# Static files
app.mount("/static", StaticFiles(directory="static"), name="static")

templates = Jinja2Templates(directory="templates")

# --- DB Dependency ---
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# --- Utility to get user by username ---
def get_user(db, username: str):
    return db.query(User).filter(User.username == username).first()

# --- Session management ---
active_sessions = {}  # In production, use Redis or database

def create_session(username: str) -> str:
    session_id = secrets.token_urlsafe(32)
    active_sessions[session_id] = username
    return session_id

def get_current_user(session_id: Optional[str] = Cookie(None), db: Session = Depends(get_db)):
    if not session_id or session_id not in active_sessions:
        return None
    username = active_sessions[session_id]
    return get_user(db, username)

def require_auth(session_id: Optional[str] = Cookie(None), db: Session = Depends(get_db)):
    user = get_current_user(session_id, db)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return user

# --- Index ---
@app.get("/", response_class=HTMLResponse)
async def index(request: Request):
    return templates.TemplateResponse("login.html", {"request": request})

# --- Register user ---
@app.post("/register")
async def register(request: Request, username: str = Form(...), password: str = Form(...), db: Session = Depends(get_db)):
    # Validate username
    if not username or len(username) < 3 or len(username) > 30:
        return templates.TemplateResponse("login.html", {
            "request": request, 
            "error": "Username must be between 3-30 characters"
        })
    
    # Check for invalid characters
    if not username.isalnum():
        return templates.TemplateResponse("login.html", {
            "request": request, 
            "error": "Username can only contain letters and numbers"
        })
    
    # Validate password
    if not password or len(password) < 6:
        return templates.TemplateResponse("login.html", {
            "request": request, 
            "error": "Password must be at least 6 characters long"
        })
    
    # Check if user already exists
    existing_user = get_user(db, username)
    if existing_user:
        return templates.TemplateResponse("login.html", {
            "request": request, 
            "error": "Username already taken"
        })        try:
            hashed_pw = bcrypt.hash(password)
            user = User(username=username, password_hash=hashed_pw)
            db.add(user)
            db.commit()
            
            # Auto-login after registration
            session_id = create_session(username)
            response = RedirectResponse(url=f"/dashboard/{username}", status_code=status.HTTP_303_SEE_OTHER)
            response.set_cookie(key="session_id", value=session_id, httponly=True, secure=False)
            return response
        except Exception as e:
        db.rollback()
        return templates.TemplateResponse("login.html", {
            "request": request, 
            "error": "Failed to create account. Please try again."
        })

# --- Login ---
@app.post("/login")
async def login(request: Request, username: str = Form(...), password: str = Form(...), db: Session = Depends(get_db)):
    user = get_user(db, username)
    if not user or not bcrypt.verify(password, user.password_hash):
        return templates.TemplateResponse("login.html", {"request": request, "error": "Invalid credentials"})

    session_id = create_session(username)
    response = RedirectResponse(url=f"/dashboard/{username}", status_code=status.HTTP_303_SEE_OTHER)
    response.set_cookie(key="session_id", value=session_id, httponly=True, secure=False)  # Set secure=True in production
    return response

# --- Dashboard ---
@app.get("/dashboard/{username}", response_class=HTMLResponse)
async def dashboard(request: Request, username: str, user: User = Depends(require_auth), db: Session = Depends(get_db)):
    # Ensure user can only access their own dashboard
    if user.username != username:
        return RedirectResponse(url=f"/dashboard/{user.username}")
    
    emails = db.query(Email).filter(Email.username == username).order_by(Email.created_at.desc()).all()
    return templates.TemplateResponse("dashboard.html", {"request": request, "user": user, "emails": emails})

# --- Set forwarding ---
@app.get("/set-forwarding/{username}", response_class=HTMLResponse)
async def set_forwarding_get(request: Request, username: str, user: User = Depends(require_auth), db: Session = Depends(get_db)):
    # Ensure user can only access their own settings
    if user.username != username:
        return RedirectResponse(url=f"/set-forwarding/{user.username}")
    
    return templates.TemplateResponse("set_forwarding.html", {"request": request, "user": user})

@app.post("/set-forwarding/{username}")
async def set_forwarding_post(request: Request, username: str, forwarding_address: str = Form(...), user: User = Depends(require_auth), db: Session = Depends(get_db)):
    # Ensure user can only modify their own settings
    if user.username != username:
        return RedirectResponse(url=f"/set-forwarding/{user.username}")
    
    # Validate email if provided
    if forwarding_address and "@" not in forwarding_address:
        return templates.TemplateResponse("set_forwarding.html", {
            "request": request, 
            "user": user, 
            "error": "Please enter a valid email address"
        })
    
    user.forwarding_address = forwarding_address if forwarding_address else None
    db.commit()
    return RedirectResponse(url=f"/dashboard/{username}", status_code=status.HTTP_303_SEE_OTHER)

# --- Logout ---
@app.post("/logout")
async def logout(session_id: Optional[str] = Cookie(None)):
    if session_id and session_id in active_sessions:
        del active_sessions[session_id]
    
    response = RedirectResponse(url="/", status_code=status.HTTP_303_SEE_OTHER)
    response.delete_cookie(key="session_id")
    return response

# --- Delete email ---
@app.post("/delete-email/{email_id}")
async def delete_email(email_id: int, user: User = Depends(require_auth), db: Session = Depends(get_db)):
    email = db.query(Email).filter(Email.id == email_id, Email.username == user.username).first()
    if email:
        db.delete(email)
        db.commit()
    return RedirectResponse(url=f"/dashboard/{user.username}", status_code=status.HTTP_303_SEE_OTHER)

# --- Webhook endpoint from Mailgun ---
@app.post("/email-inbound")
async def email_inbound(request: Request, db: Session = Depends(get_db)):
    form = await request.form()
    recipient = form.get("recipient")
    subject = form.get("subject")
    body_plain = form.get("body-plain")
    from_address = form.get("sender")

    username = recipient.split("@")[0]

    user = get_user(db, username)
    if not user:
        return {"status": "User not found"}

    # Save email
    email = Email(username=username, subject=subject, body=body_plain, from_address=from_address)
    db.add(email)
    db.commit()

    # Forward if set
    if user.forwarding_address:
        try:
            msg = MIMEText(body_plain)
            msg["Subject"] = f"[Fwd] {subject}" if subject else "[Fwd] (No Subject)"
            msg["From"] = f"noreply@estrogen.email"
            msg["To"] = user.forwarding_address
            msg["Reply-To"] = from_address

            # SMTP Configuration - use environment variables
            smtp_host = os.getenv("SMTP_HOST", "smtp.gmail.com")
            smtp_port = int(os.getenv("SMTP_PORT", "587"))
            smtp_user = os.getenv("SMTP_USER")
            smtp_password = os.getenv("SMTP_PASSWORD")

            if smtp_user and smtp_password:
                with smtplib.SMTP(smtp_host, smtp_port) as server:
                    server.starttls()
                    server.login(smtp_user, smtp_password)
                    server.send_message(msg)
        except Exception as e:
            print(f"Failed to forward email: {e}")
            # Don't fail the webhook if forwarding fails

    return {"status": "Email stored and processed"}
