import path from 'path';
import appRootPath from 'app-root-path';
import fs from 'node:fs';
import papaparse from 'papaparse';

export const getCSVEntries = (csvFile: any) => {
  const filePath = path.join(appRootPath.path, 'temporary', `data.csv`);
  fs.writeFileSync(filePath, csvFile.data);
  const localCSVFile = fs.readFileSync(filePath, 'utf-8');
  const csvRows = papaparse.parse(localCSVFile)?.data;
  fs.unlinkSync(filePath);
  return csvRows as string[][];
};
