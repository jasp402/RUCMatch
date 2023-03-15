# RUCMatch
RUCMatch is an application designed for the dynamic generation of Peruvian RUC numbers, especially for testing. With RUCMatch, users can quickly obtain a valid RUC number for use in testing or application testing.

# Getting Started
Prerequisites
- Node.js v10+
- npm

# Installation
Install from npm:
````js
npm i rucmatch
````

# Table of Contents

| N° 	| Función                   	| Dependencias                                                             	|
|----	|---------------------------	|--------------------------------------------------------------------------	|
| 1  	| connectToInternalDatabase 	|                                                                          	|
| 2  	| getLastUpdate             	|                                                                          	|
| 3  	| unzipFile                 	|                                                                          	|
| 4  	| insertData                	|                                                                          	|
| 5  	| formatCSV                 	|                                                                          	|
| 6  	| updateData                	| formatCSV, insertData                                                    	|
| 7  	| shouldDownload            	|                                                                          	|
| 8  	| downloadAndSaveZip        	|                                                                          	|
| 9  	| updateFromSunat           	| getLastUpdate, shouldDownload, downloadAndSaveZip, unzipFile, updateData 	|
| 10 	| matchFromLocalDB          	|                                                                          	|
| 11 	| getRandomRuc              	| connectToInternalDatabase                                                	|
| 12 	| isValidRuc                	|                                                                          	|
| 13 	| rucDisable                	| connectToInternalDatabase                                                	|
| 14 	| rucEnable                 	| connectToInternalDatabase                                                	|
| 15 	| searchRuc                 	| isValidRuc, connectToInternalDatabase                                    	|



# Built With

- Node.js
- Sequelize
- Cheerio
- Adm-zip
- Axios
- csv-parser

# License
This project is licensed under the MIT License - see the LICENSE file for details.