import sys
import dspy
import os
import json
import chromadb
api_key = os.getenv('OPENAI_API_KEY')

lm = dspy.LM('openai/gpt-4o-mini', api_key=api_key)
dspy.configure(lm=lm)

chroma_client = chromadb.PersistentClient(path="./chroma_db")
collection = chroma_client.get_or_create_collection("rag_docs")

def load_json(file_path):
    with open(file_path, "r", encoding="utf-8") as file:
        data = json.load(file)
    return data  

def add_qa_pairs(qa_pairs):
    for i, pair in enumerate(qa_pairs):
        collection.add(ids=[str(i)], documents=[pair["question"] + " " + pair["answer"]])

def retrieve(query, top_k=3):
    results = collection.query(query_texts=[query], n_results=top_k)
    return results["documents"][0] if results["documents"] else []

class RAG(dspy.Module):
    def __init__(self,retriever):
        self.retriever = retriever
        self.respond = dspy.ChainOfThought('context, question -> response')

    def forward(self, question):
        docs = self.retriever(question)
        context = "\n".join(docs)
        return self.respond(context=context, question=question)

if __name__ == '__main__':
    json_file = "qa_data.json"  
    qa_pairs = load_json(json_file)
    add_qa_pairs(qa_pairs)
    rag_model = RAG(retrieve)
    question = f"""On a scale from 0 - 100 how accarate is this answer,
    Question:{sys.argv[1]}Correct Answer:{sys.argv[2]},Acutal
    Answer{sys.argv[3]}"""
    answer = rag_model.forward(question)
    print("RAG Answer:", answer)
