from flask import Flask, render_template, request, jsonify
from google import genai
import os
import PyPDF2

app = Flask(__name__)

# Initialize GenAI Client using provided API key
API_KEY = "AIzaSyDheFhnVVeWYIx-QIi_l5Z_TW4Fa7jUPUc"
client = genai.Client(api_key=API_KEY)

@app.route("/", methods=["GET"])
def index():
    return render_template("index.html")

@app.route("/api/chat", methods=["POST"])
def chat():
    # Because we are using FormData, data is in request.form
    message = request.form.get("message", "")
    file = request.files.get("file")
    
    if not message:
        return jsonify({"error": "Message is required"}), 400
        
    context_text = ""
    if file and file.filename.endswith('.pdf'):
        try:
            pdf_reader = PyPDF2.PdfReader(file)
            for page in pdf_reader.pages:
                text = page.extract_text()
                if text:
                    context_text += text + "\n"
        except Exception as e:
            return jsonify({"error": f"Failed to parse PDF: {str(e)}"}), 400
            
    # Construct augmented prompt
    if context_text:
        augmented_prompt = f"Context Information:\n{context_text}\n\nUser Query: {message}\n\nPlease answer the user query using the provided context."
    else:
        augmented_prompt = message
    
    try:
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=augmented_prompt,
        )
        return jsonify({"response": response.text})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(port=5000, debug=True)
