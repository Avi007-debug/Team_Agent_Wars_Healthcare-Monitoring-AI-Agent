from retrieval.hybrid_retriever import retrieve, no_knowledge_check

while True:

    query = input("\nAsk medical query (type exit): ")

    if query.lower() == "exit":
        break

    docs = retrieve(query)

    # ------------------- NEW FEATURE -------------------
    # No knowledge safety check
    # ---------------------------------------------------

    if not docs or no_knowledge_check(query, docs):

        print("\nNo relevant information found in the dataset.\n")

        continue

    # ---------------------------------------------------

    print("\nTop Retrieved Documents:\n")

    for i, doc in enumerate(docs):

        print(f"{i+1}. [{doc['type']} - {doc['name']} - {doc['section']}]")

        print(doc["text"])

        print()