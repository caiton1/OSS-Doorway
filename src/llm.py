import sys
import dspy
import os
api_key = os.getenv('OPENAI_API_KEY')

lm = dspy.LM('openai/gpt-4o-mini', api_key=api_key)
dspy.configure(lm=lm)

def addToResponse(hint):
    qa = dspy.ChainOfThought('question -> answer: str')
    response = qa(question=f"""Can you expand on this text to make it more
        exciting:{hint}""")
    return response.answer

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("Python scipt has too many args")
    else:
        hint = sys.argv[1]
        print(addToResponse(hint))

