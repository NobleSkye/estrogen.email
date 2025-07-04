from pydantic import BaseModel

class UserCreate(BaseModel):
    username: str
    password: str

class ForwardingUpdate(BaseModel):
    forwarding_address: str
