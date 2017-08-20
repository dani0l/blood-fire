import download from 'download';
import fs from 'fs';
import zlib from 'zlib';
import csv from 'fast-csv';

import transformData from './blood-line';

const productionURL = 'https://www.dropbox.com/sh/pprrtnz0v6zt978/AABtu7bXJ4Vk5pxhGnQtIjMXa/GlicemiaMisurazioni.csv.gz?dl=1';

const developmentURL = 'http://127.0.0.1:8080/GlicemiaMisurazioni.csv.gz'

export default function fetchAllData({isDevelopment}) {
	const url = isDevelopment ? developmentURL : productionURL;

	console.log(`Fetching new data (${url})`);

	const storage = [];
	const gunzip = zlib.createGunzip();

	return new Promise((resolve, reject) => {
		function handleCSVEntry(data) {
			const transformedData = transformData(data);

			if (transformedData && transformedData.level) {
				storage.push(transformedData);
			}
		}

		function handleCSVFinish() {
			console.log('CSV Transformation Done');
			resolve(storage);
		}

		var csvStream = csv()
			.on('data', handleCSVEntry)
			.on('end', handleCSVFinish);

		const downloadPromise = download(url);
		downloadPromise.catch(reject);
		downloadPromise.pipe(gunzip).pipe(csvStream);
	});
}