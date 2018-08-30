import path from 'path';
import fs from 'fs';
import lineReader from 'line-reader';

// console.log(path.resolve(__dirname, '../main.scss'));
const filePath = path.resolve(__dirname, '../../data/followers-bad.json');
const newFilePath = path.resolve(__dirname, '../../data/followers.json');

const file = fs.createReadStream(filePath);
const ws = fs.createWriteStream(newFilePath);
// console.log(ws);
ws.write('[');
const opening = Buffer.from('[');
const closing = Buffer.from(']');
lineReader.eachLine(filePath, (line, last) => {
  // const lineBuffer = Buffer.from(line);
  ws.write(line);
  ws.write(',\r\n');
  // console.log(line);
  // console.log(last);
  if (last) {
    ws.write(']');
    console.log(last);
    return false; // stop reading
  }
});
