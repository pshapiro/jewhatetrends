# Research Plan: Antisemitic Hate Crime Data Collection, Analysis, and Forecasting System

## Objectives
- Develop a multi-source data collection pipeline for antisemitic hate crime incidents.
- Implement a robust ETL process for data cleaning, schema unification, and enrichment.
- Build statistical forecasting models to predict future trends in antisemitic hate crimes.
- Analyze the correlation between online signals (social media, search trends) and real-world incidents.
- Create nowcasting algorithms for real-time risk assessment.
- Produce validated and processed datasets ready for consumption by a web dashboard.
- Document the methodology, data sources, and system architecture.

## Research Breakdown
- **Data Acquisition**:
  - Sub-task 1.1: Access and download data from the FBI's Crime Data Explorer (CDE).
  - Sub-task 1.2: Obtain ADL H.E.A.T. Map data and incident tracker information.
  - Sub-task 1.3: Collect data from city police open-data portals (NYPD, LAPD, Chicago).
  - Sub-task 1.4: Gather Google Trends data for relevant keywords.
  - Sub-task 1.5: Investigate and access data from the CyberWell Live Database.
  - Sub-task 1.6: Acquire National Crime Victimization Survey (NCVS) data for under-reporting correction.
- **ETL Pipeline**:
  - Sub-task 2.1: Develop scripts to clean and standardize data from each source.
  - Sub-task 2.2: Unify the data under a common schema.
  - Sub-task 2.3: Implement deduplication logic using fuzzy matching.
  - Sub-task 2.4: Apply NCVS correction factors to account for under-reporting.
  - Sub-task 2.5: Geocode location data to county FIPS codes.
- **Modeling & Analysis**:
  - Sub-task 3.1: Implement a time series forecasting model (GAM or Prophet with Negative Binomial likelihood).
  - Sub-task 3.2: Incorporate exogenous variables (Google Trends, holiday data, etc.).
  - Sub-task 3.3: Perform cross-correlation analysis to find lead-lag relationships.
  - Sub-task 3.4: Develop a nowcasting model for real-time risk assessment.
  - Sub-task 3.5: Validate model accuracy using historical data.
- **Output & Deliverables**:
  - Sub-task 4.1: Generate processed datasets in JSON/CSV format.
  - Sub-task 4.2: Define API endpoint structures for the frontend.
  - Sub-task 4.3: Create comprehensive documentation.

## Key Questions
1. What are the historical trends and patterns in antisemitic hate crimes in the United States?
2. Can we identify a predictive relationship between online hate speech/search interest and offline hate crime incidents?
3. What is the estimated "true" number of antisemitic hate crimes after adjusting for under-reporting?
4. Can we provide reliable short-term forecasts and real-time risk assessments of antisemitic hate crimes?

## Resource Strategy
- **Primary data sources**: FBI CDE, ADL, NYPD/LAPD/Chicago Police open data, Google Trends, CyberWell, NCVS.
- **Search strategies**: Use specific keywords to find the data portals and APIs for each source.
- **Programming Language and Libraries**: Python with `pandas`, `scikit-learn`, `statsmodels`, `prophet`, `pytrends`.

## Verification Plan
- **Source requirements**: Utilize at least 3-5 different data sources to ensure comprehensive coverage.
- **Cross-validation**: Validate forecasting models using time-series cross-validation techniques to prevent overfitting. Compare model performance against baseline models.

## Expected Deliverables
- A final report documenting the entire project.
- Processed datasets in `data/` directory.
- Python scripts for the entire pipeline in `code/` directory.
- A `docs/` folder with the research plan and methodology.

## Workflow Selection
- **Primary focus**: Search-Focused Workflow
- **Justification**: The initial and most critical phase of this project is to locate, understand, and acquire data from a variety of disparate sources. A search-focused approach is necessary to build the foundation of the project before moving into the more intensive modeling and analysis phases.
