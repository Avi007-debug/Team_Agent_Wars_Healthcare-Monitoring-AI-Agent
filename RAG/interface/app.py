from pathlib import Path
import sys

import gradio as gr

ROOT_DIR = Path(__file__).resolve().parent.parent
if str(ROOT_DIR) not in sys.path:
	sys.path.insert(0, str(ROOT_DIR))

from agent.medical_agent import medical_agent


def chat(query):
	if not query or not query.strip():
		return "Please enter a query."

	return medical_agent(query)


gr.Interface(
	fn=chat,
	inputs=gr.Textbox(placeholder="Ask about diseases, drugs, nutrition..."),
	outputs="text",
	title="🩺 Medical AI Assistant",
	description="AI-powered healthcare assistant using RAG + tools",
).launch()