#!/usr/bin/env python3
"""
Test script to simulate Mailgun webhook calls
Usage: python test_webhook.py
"""

import requests
import json

# Test webhook data (simulates Mailgun POST)
webhook_data = {
    "recipient": "testuser@estrogen.email",
    "sender": "friend@example.com", 
    "subject": "Test Email",
    "body-plain": "Hello! This is a test email to verify the webhook is working.\n\nBest regards,\nYour friend"
}

def test_webhook():
    url = "http://localhost:8000/email-inbound"
    
    print("🧪 Testing email webhook...")
    print(f"📨 Sending test email to: {webhook_data['recipient']}")
    print(f"📧 From: {webhook_data['sender']}")
    print(f"📝 Subject: {webhook_data['subject']}")
    
    try:
        response = requests.post(url, data=webhook_data)
        
        if response.status_code == 200:
            print("✅ Webhook test successful!")
            print(f"📬 Response: {response.json()}")
        else:
            print(f"❌ Webhook test failed with status: {response.status_code}")
            print(f"📄 Response: {response.text}")
            
    except requests.exceptions.ConnectionError:
        print("❌ Could not connect to server. Make sure it's running on localhost:8000")
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    test_webhook()
