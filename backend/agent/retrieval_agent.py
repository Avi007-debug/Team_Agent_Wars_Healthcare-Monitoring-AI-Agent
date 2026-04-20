retrieve = None


def get_retriever():
	global retrieve
	if retrieve is None:
		from retrieval.hybrid_retriever import retrieve as r
		retrieve = r
	return retrieve


def retrieval_agent(query):
	retriever = get_retriever()
	return retriever(query)