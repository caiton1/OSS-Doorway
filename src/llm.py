import sys
import dspy
import os
api_key = os.getenv('OPENAI_API_KEY')

lm = dspy.LM('openai/gpt-4o-mini', api_key=api_key)
dspy.configure(lm=lm)

def addToResponse(question,right,real):
    qa = dspy.ChainOfThought('question -> answer: int')
    response = qa(question=f"""Compare this answer and the right answer and
    give a rating from 1-10 :question{question} right: {right},answer : {real}""")
    return response.answer

if __name__ == '__main__':
    if len(sys.argv) < 4:
        print("Python scipt has incorrect args")
    else:
        print(addToResponse(sys.argv[1],sys.argv[2],sys.argv[3]))

