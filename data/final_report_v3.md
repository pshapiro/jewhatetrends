# Comprehensive Antisemitic Hate Crime Data Collection, Analysis, and Forecasting System - Final Report V3

## 1. Project Overview

The goal of this project was to build a comprehensive system to collect, analyze, and forecast antisemitic hate crime data. The system was designed to ingest data from multiple sources, unify it into a common schema, and use statistical models to generate forecasts and identify trends. Due to significant and persistent challenges in accessing key data sources and installing necessary software libraries, the scope of the project was limited to the analysis of data from the NYPD and LAPD, and the use of a basic forecasting model.

## 2. Data Acquisition

### 2.1. Data Sources

The project successfully acquired data from the following sources:

*   **NYPD:** Hate crime data was downloaded from the NYC Open Data portal.
*   **LAPD:** Hate crime data was downloaded from the LA City Open Data portal.

### 2.2. Challenges

Significant and persistent challenges were encountered in accessing the other planned data sources. These challenges proved to be insurmountable within the current environment:

*   **FBI, ADL, CyberWell, data.gov:** Access to these websites was consistently blocked, likely due to IP address restrictions or other security measures. Multiple attempts to access these sites, including targeted searches, attempts to find mirror sites, and the use of the Wayback Machine, were unsuccessful.
*   **Chicago Police Department:** The dataset was too large to download directly, and attempts to filter the data through the web interface were unsuccessful due to timeouts.
*   **Google Trends, Prophet, PyGAM, holidays:** The installation of the necessary Python libraries for accessing Google Trends data and for building more advanced forecasting models (`pytrends`, `prophet`, `pygam`, `holidays`) consistently failed due to timeouts.
*   **NCVS:** The full dataset was located on the ICPSR website, but the download was blocked by a reCAPTCHA verification that could not be completed by the available tools.

## 3. Data Processing

### 3.1. Schema Unification

The NYPD and LAPD datasets were unified into a common schema with the following fields:

*   `date`
*   `state`
*   `county`
*   `bias_motivation`
*   `source`
*   `incident_id`
*   `offense_type`
*   `victim_type`

### 3.2. Data Cleaning

The `bias_motivation` column was cleaned to standardize the different bias motivations and group less frequent or ambiguous entries. The LAPD data, in particular, required significant cleaning, as the `bias_motivation` column was populated with penal codes. The `NIBR Description` field was used as a proxy for bias motivation in this case.

### 3.3. NCVS Under-Reporting Correction

An under-reporting correction factor of 1.45 was applied to all incidents with a bias motivation of "ANTI-JEWISH", as specified in the user's research document.

## 4. Exploratory Data Analysis

An exploratory analysis of the cleaned and corrected data was performed. The following visualizations were created:

### 4.1. Hate Crimes by State

![Hate Crimes by State](charts/hate_crimes_by_state.png)

### 4.2. Hate Crimes by County

![Hate Crimes by County](charts/hate_crimes_by_county.png)

### 4.3. Hate Crimes by Bias Motivation

![Hate Crimes by Bias Motivation](charts/hate_crimes_by_bias_motivation.png)

### 4.4. Time Series of Hate Crime Incidents

A time series plot of the monthly hate crime incidents was created to visualize the trends and seasonality in the data.

![Hate Crime Time Series](charts/hate_crime_time_series.png)

## 5. Forecasting

A SARIMA (Seasonal Autoregressive Integrated Moving Average) model was used to forecast the number of hate crime incidents for the next 12 months. The model was chosen for its ability to account for seasonality and trends in the data. The following plot shows the historical data along with the forecast.

![Hate Crime Forecast](charts/hate_crime_forecast.png)

## 6. Limitations and Future Work

The primary limitation of this project is the lack of data from the originally planned sources. This has significantly reduced the scope and generalizability of the findings. The inability to install key Python libraries has also limited the sophistication of the forecasting models.

Future work should focus on the following:

*   **Resolving Data Access and Environment Issues:** The highest priority for future work is to resolve the data access and environment issues that plagued this project. This will likely require a different approach, such as:
    *   **Manual Download and Upload:** If automated access is not possible, the data should be downloaded manually and then uploaded to the environment.
    *   **Direct Contact with Data Providers:** Contacting the data providers directly may be necessary to obtain access to the data.
    *   **Different Network/IP Configuration:** Exploring the use of a different network or IP configuration may be necessary to bypass the security measures on the websites.
    *   **Alternative Environment:** If the library installation issues persist, it may be necessary to use a different environment that allows for more flexibility in installing packages.
*   **Implementing Core Features:** Once the data access and environment issues are resolved, the following core features of the project should be implemented:
    *   **GAM/Prophet with Negative Binomial likelihood:** These more sophisticated forecasting models should be implemented to provide more accurate forecasts.
    *   **Lead-Lag Analysis:** A correlation analysis should be performed to identify any lead-lag relationships between online signals (e.g., Google Trends) and offline crimes.
    *   **Nowcasting:** A nowcasting algorithm should be developed to provide real-time risk assessments.
*   **Robust Forecasting and Validation:** The forecasting models should be rigorously validated and tested against historical data to ensure their accuracy.
