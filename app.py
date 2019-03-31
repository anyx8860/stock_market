from flask import Flask, abort
from flask import make_response, send_from_directory
import requests
from io import StringIO
import csv
import json

app = Flask(__name__)

@app.route("/")
def hello():
    return app.send_static_file('index.html')

@app.route('/<path:path>')
def serve_page(path):
    return send_from_directory('static', path)

@app.route("/symbol/<symbol>")
def get_data(symbol):

    params = { 
            'function': 'TIME_SERIES_WEEKLY', 
            'symbol': symbol,
            'apikey': 'H3FAX855K1LY0X3T',
            'outputsize': 'full',
            'datatype': 'csv'
            }
    print(f'Getting symbol data for {symbol} from Alphavantage ...')
    r = requests.get('https://www.alphavantage.co/query', params=params)
    if not r:
        print(f'GET request for {symbol} failed!')
        abort(404)

    # check if the API call succeeded.
    try:
        rsp_json = r.json()
    except json.decoder.JSONDecodeError:
        pass
    else:
        if 'Error Message' in rsp_json:
            print(f'Received error "{rsp_json["Error Message"]}" for Symbol {symbol}.')
            abort(404)

    # create a CSV reader from the response text.
    f = StringIO(r.text)
    output = make_response(f.getvalue())
    output.headers["Content-Disposition"] = "attachment; filename=export.csv"
    output.headers["Content-type"] = "text/csv"
    print(f'Returning CSV data for {symbol}')
    return output
    
