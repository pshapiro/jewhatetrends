import requests

url = "https://data.lacity.org/api/views/y8y3-fqfu/rows.csv?accessType=DOWNLOAD"
response = requests.get(url)

if response.status_code == 200:
    with open("data/lapd_hate_crimes.csv", "wb") as f:
        f.write(response.content)
    print("Successfully downloaded LAPD hate crime data.")
else:
    print(f"Failed to download data. Status code: {response.status_code}")
