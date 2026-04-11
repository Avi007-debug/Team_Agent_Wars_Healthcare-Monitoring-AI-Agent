from pathlib import Path
import sys

import gradio as gr

ROOT_DIR = Path(__file__).resolve().parent.parent
if str(ROOT_DIR) not in sys.path:
	sys.path.insert(0, str(ROOT_DIR))

from agent.medical_agent import medical_agent


CSS = """
:root {
    --bg-a: #f4f8f6;
    --bg-b: #dcefe6;
    --card: #ffffff;
    --ink: #1d3b34;
    --accent: #0e8f67;
    --accent-2: #0a6e8d;
    --muted: #6c7a76;
}

body {
    background:
        radial-gradient(circle at 10% 10%, rgba(14, 143, 103, 0.14), transparent 35%),
        radial-gradient(circle at 90% 20%, rgba(10, 110, 141, 0.12), transparent 30%),
        linear-gradient(135deg, var(--bg-a), var(--bg-b));
}

.app-shell {
    max-width: 980px;
    margin: 0 auto;
    padding: 16px;
}

.hero {
    background: linear-gradient(120deg, #0e8f67, #0a6e8d);
    border-radius: 18px;
    color: #f5fffb;
    padding: 20px;
    box-shadow: 0 10px 28px rgba(12, 63, 53, 0.28);
    animation: liftIn 0.65s ease-out;
}

.hero h1 {
    margin: 0 0 6px;
    font-size: 1.8rem;
    letter-spacing: 0.4px;
}

.hero p {
    margin: 0;
    color: #d9ffef;
}

.pill-row {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
    margin-top: 14px;
}

.pill {
    background: rgba(255, 255, 255, 0.18);
    border: 1px solid rgba(255, 255, 255, 0.35);
    border-radius: 999px;
    padding: 5px 12px;
    font-size: 0.85rem;
}

.chat-card {
    margin-top: 14px;
    border-radius: 18px;
    border: 1px solid #d8e7df;
    background: var(--card);
    box-shadow: 0 14px 30px rgba(25, 54, 47, 0.12);
    animation: riseIn 0.8s ease-out;
}

.chat-card .message-row {
    animation: fadeSlide 0.3s ease-out;
}

.tips {
    color: var(--muted);
    font-size: 0.92rem;
}

@keyframes liftIn {
    from {
        opacity: 0;
        transform: translateY(14px) scale(0.985);
    }
    to {
        opacity: 1;
        transform: translateY(0) scale(1);
    }
}

@keyframes riseIn {
    from {
        opacity: 0;
        transform: translateY(20px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

@keyframes fadeSlide {
    from {
        opacity: 0;
        transform: translateX(8px);
    }
    to {
        opacity: 1;
        transform: translateX(0);
    }
}

@media (max-width: 720px) {
    .hero h1 {
        font-size: 1.35rem;
    }
}
"""


EXAMPLE_QUERIES = [
	"symptoms of diabetes",
	"side effects of aspirin",
	"nutrition in rice",
	"drug interaction aspirin ibuprofen",
	"blood pressure 160 diet score 3",
]


def _to_memory(history):
	memory = []
	for user_msg, bot_msg in history:
		memory.append({"user": user_msg, "assistant": bot_msg})
	return memory[-12:]


def respond(message, history):
	if history is None:
		history = []

	query = (message or "").strip()
	if not query:
		return history, history, ""

	memory = _to_memory(history)
	answer = medical_agent(query, conversation_memory=memory)

	history = history + [(query, answer)]
	return history, history, ""


def clear_all():
	return [], [], ""


def use_example(example_text):
	return example_text


with gr.Blocks(title="Medical AI Assistant") as demo:
	with gr.Column(elem_classes=["app-shell"]):
		gr.HTML(
			"""
			<div class='hero'>
			  <h1>Medical AI Assistant</h1>
			  <p>Hybrid retrieval + tools + insights in one clean clinical interface.</p>
			  <div class='pill-row'>
			    <span class='pill'>Hybrid RAG</span>
			    <span class='pill'>Multi-Agent</span>
			    <span class='pill'>Health Insights</span>
			    <span class='pill'>Safety Fallback</span>
			  </div>
			</div>
			"""
		)

		history_state = gr.State([])

		with gr.Column(elem_classes=["chat-card"]):
			chatbot = gr.Chatbot(
				label="Assistant Conversation",
				height=470,
			)

		with gr.Row():
			query_box = gr.Textbox(
				label="Ask a health question",
				placeholder="Try: symptoms of diabetes, side effects of aspirin, nutrition in rice...",
				scale=8,
			)
			send_btn = gr.Button("Send", variant="primary", scale=1)

		with gr.Row():
			clear_btn = gr.Button("Clear Chat")
			retry_hint = gr.Markdown("<span class='tips'>Tip: Ask follow-ups like 'and treatment?' to use memory-aware retrieval.</span>")

		gr.Markdown("### Quick Query Presets")
		with gr.Row():
			example_buttons = [gr.Button(text) for text in EXAMPLE_QUERIES]

		send_btn.click(
			fn=respond,
			inputs=[query_box, history_state],
			outputs=[chatbot, history_state, query_box],
		)

		query_box.submit(
			fn=respond,
			inputs=[query_box, history_state],
			outputs=[chatbot, history_state, query_box],
		)

		clear_btn.click(
			fn=clear_all,
			inputs=[],
			outputs=[chatbot, history_state, query_box],
		)

		for button, text in zip(example_buttons, EXAMPLE_QUERIES):
			button.click(fn=use_example, inputs=gr.State(text), outputs=query_box)


if __name__ == "__main__":
	demo.launch(css=CSS)