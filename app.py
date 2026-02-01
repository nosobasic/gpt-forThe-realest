"""
Flask Backend API for ChatGPT Clone
Handles OpenAI API communication securely
"""

import os
from flask import Flask, request, jsonify
from flask_cors import CORS
from openai import OpenAI
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Initialize Flask app
app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Initialize OpenAI client
openai_api_key = os.getenv('OPENAI_API_KEY')
client = None
if openai_api_key:
    client = OpenAI(api_key=openai_api_key)


@app.route('/')
def health_check():
    """Health check endpoint"""
    return jsonify({"status": "ok", "message": "Backend is running"})


@app.route('/chat', methods=['POST'])
@app.route('/api/chat', methods=['POST'])
def chat():
    """
    Handle chat requests from frontend
    Expects: { "messages": [{"role": "user", "content": "..."}, ...] }
    Returns: { "response": "..." } or { "message": "..." }
    """
    try:
        if not client:
            return jsonify({
                "error": {
                    "message": "OPENAI_API_KEY environment variable is not set"
                }
            }), 500
        
        data = request.get_json()
        
        if not data or 'messages' not in data:
            return jsonify({
                "error": {
                    "message": "Missing 'messages' field in request body"
                }
            }), 400
        
        messages = data['messages']
        
        if not isinstance(messages, list) or len(messages) == 0:
            return jsonify({
                "error": {
                    "message": "Messages must be a non-empty array"
                }
            }), 400
        
        # Call OpenAI API
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=messages,
            temperature=0.7
        )
        
        # Extract the assistant's response
        assistant_message = response.choices[0].message.content
        
        # Return in format that frontend expects
        return jsonify({
            "response": assistant_message,
            "message": assistant_message  # Also include for compatibility
        })
        
    except Exception as e:
        error_message = str(e)
        return jsonify({
            "error": {
                "message": error_message
            }
        }), 500


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 3000))
    app.run(host='0.0.0.0', port=port, debug=False)

