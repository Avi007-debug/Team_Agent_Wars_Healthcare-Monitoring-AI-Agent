from pathlib import Path
import sys

import gradio as gr

ROOT_DIR = Path(__file__).resolve().parent.parent
if str(ROOT_DIR) not in sys.path:
	sys.path.insert(0, str(ROOT_DIR))

from agent.medical_agent import medical_agent


def chat(message, history, memory):
	if not message or not message.strip():
		return "", history or [], memory or []

	memory = memory or []

	try:
		response = medical_agent(message, conversation_memory=memory)
	except Exception as exc:
		response = f"Sorry, something went wrong while processing your request: {exc}"

	history = history or []
	history.append((message, response))
	memory.append({"user": message, "assistant": response})
	memory = memory[-12:]
	return "", history, memory


def clear_chat():
	return [], []


examples = [
	"symptoms of diabetes",
	"side effects of hydrocortisone",
	"drug interaction aspirin and ibuprofen",
	"remind me to take vitamin d at 8 pm",
	"age 52 blood pressure 150",
]


theme = gr.themes.Soft(
	primary_hue="emerald",
	secondary_hue="sky",
	neutral_hue="slate",
)


css = """
.gradio-container {
	background:
		radial-gradient(circle at top left, rgba(16, 185, 129, 0.16), transparent 28%),
		radial-gradient(circle at top right, rgba(14, 165, 233, 0.16), transparent 32%),
		linear-gradient(180deg, #f4fbf8 0%, #eef7ff 100%);
}

#hero {
	padding: 24px;
	border: 1px solid rgba(15, 23, 42, 0.08);
	border-radius: 20px;
	background: rgba(255, 255, 255, 0.82);
	backdrop-filter: blur(10px);
	box-shadow: 0 24px 60px rgba(15, 23, 42, 0.08);
	margin-bottom: 18px;
}

#hero h1 {
	margin: 0;
	font-size: 2.2rem;
	line-height: 1.1;
}

#hero p {
	margin: 10px 0 0;
	font-size: 1rem;
	color: #334155;
}
"""


with gr.Blocks(title="Medical AI Assistant") as demo:
	gr.Markdown(
		"""
		<div id="hero">
		  <h1>Medical AI Assistant</h1>
		  <p>Ask medical questions, check basic drug interactions, create reminders, or estimate simple blood pressure risk. This assistant uses your hybrid retriever first and falls back to lightweight tools when the question matches a supported action.</p>
		</div>
		"""
	)

	chatbot = gr.Chatbot(height=520, label="Assistant")
	memory_state = gr.State([])
	msg = gr.Textbox(
		label="Your question",
		placeholder="Try: symptoms of diabetes or drug interaction aspirin and ibuprofen",
	)

	with gr.Row():
		submit = gr.Button("Ask", variant="primary")
		clear = gr.Button("Clear")

	gr.Examples(examples=examples, inputs=msg, label="Examples")
	gr.Markdown("Small safety note: this assistant is informational and should not replace professional medical advice or emergency care.")

	submit.click(chat, inputs=[msg, chatbot, memory_state], outputs=[msg, chatbot, memory_state])
	msg.submit(chat, inputs=[msg, chatbot, memory_state], outputs=[msg, chatbot, memory_state])
	clear.click(clear_chat, outputs=[chatbot, memory_state])


demo.launch(theme=theme, css=css)