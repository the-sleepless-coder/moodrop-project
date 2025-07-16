from flask import Flask, render_template, request

app = Flask(__name__)

@app.route('/', methods=['GET', 'POST'])

def index():
    if request.method == 'POST':
        # Handle form submission here
        pass
    return render_template('index.html')

@app.route('/button', methods=['POST'])
def button():
    user_input = request.form.get('inputText')
    print(f"User input: {user_input}")
    numt_list = []
    for i in range(1, int(user_input) + 1):
        if int(user_input) % i == 0:
            numt_list.append(i)
    
    print(f"Divisors of {user_input}: {numt_list}")
    print(f"{numt_list}")
    return render_template('index.html', num_list=numt_list)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=2222)