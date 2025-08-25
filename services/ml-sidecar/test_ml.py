#!/usr/bin/env python3

import requests
import json

def test_ml_pipeline():
    """Test the ML pipeline with a simple request"""
    
    # Test health endpoint
    print("Testing health endpoint...")
    response = requests.get("http://localhost:5001/health")
    print(f"Health: {response.json()}")
    
    # Test summarization with a test podcast ID
    print("\nTesting summarization...")
    test_data = {"podcast_id": "test-running-shoes-2025"}
    response = requests.post(
        "http://localhost:5001/summarize",
        headers={"Content-Type": "application/json"},
        json=test_data
    )
    
    if response.status_code == 200:
        result = response.json()
        print(f"✅ Summarization successful!")
        print(f"Summary: {result.get('summary', 'N/A')}")
        print(f"Keywords: {result.get('keywords', [])}")
    else:
        print(f"❌ Summarization failed: {response.status_code}")
        print(f"Error: {response.text}")

if __name__ == "__main__":
    test_ml_pipeline() 