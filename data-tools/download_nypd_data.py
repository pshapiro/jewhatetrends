import requests

url = "https://data.cityofnewyork.us/api/views/bqiq-cu78/rows.csv?accessType=DOWNLOAD"
response = requests.get(url)

if response.status_code == 200:
    with open("data/nypd_hate_crimes.csv", "wb") as f:
        f.write(response.content)
    print("Successfully downloaded NYPD hate crime data.")
else:
    print(f"Failed to download data. Status code: {response.status_code}")
