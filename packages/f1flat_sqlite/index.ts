#!/usr/bin/env ts-node --esm
/* eslint-disable no-console */
import { stat, mkdir, rm, readFile } from 'fs/promises';
import { join } from 'path';

import chalk from 'chalk';
import { parse } from 'csv-parse';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

import {
  circuitSchema,
  constructorSchema,
  driverSchema,
  seasonSchema,
  raceSchema,
  raceResultSchema,
  constructorResultSchema,
  constructorStandingSchema,
  driverStandingSchema,
  lapTimeSchema,
  pitStopSchema,
  qualifyingSessionSchema,
  sprintResultSchema,
  statusSchema,
} from '@jgrosspietsch/f1flat_types';

// eslint-disable-next-line no-underscore-dangle
const __dirname = new URL('.', import.meta.url).pathname;

sqlite3.verbose();

const csvFiles = [
  'circuits.csv',
  'constructor_results.csv',
  'constructor_standings.csv',
  'constructors.csv',
  'driver_standings.csv',
  'drivers.csv',
  'lap_times.csv',
  'pit_stops.csv',
  'qualifying.csv',
  'races.csv',
  'results.csv',
  'seasons.csv',
  'sprint_results.csv',
  'status.csv',
];

// Preflight check
try {
  const path = join(__dirname, 'csv');
  const stats = await stat(path);

  if (stats.isDirectory()) {
    console.log(chalk.green('Directory exists'));
  } else {
    console.error(chalk.red('Directory does not exist'));
    process.exit(1);
  }

  for (const file of csvFiles) {
    const filePath = join(path, file);
    // eslint-disable-next-line no-await-in-loop
    const fileStats = await stat(filePath);

    if (fileStats.isFile()) {
      console.log(chalk.green(`${file} exists`));
    } else {
      console.error(chalk.red(`${file} does not exist`));
      process.exit(1);
    }
  }
} catch (error) {
  console.error(chalk.red(error));
  process.exit(1);
}

// Delete output DB if it exists
try {
  await mkdir(join(__dirname, 'out'), { recursive: true });
  const path = join(__dirname, 'out', 'f1.sqlite');
  const stats = await stat(path);

  if (stats.isFile()) {
    console.log(chalk.cyan('Deleting existing database...'));
    await rm(path);
  }
} catch (error) {
  // Ignore
}

// Create database
try {
  const db = await open({
    filename: join(__dirname, 'out', 'f1.sqlite'),
    driver: sqlite3.Database,
  });

  console.log(chalk.cyan('Enabling foreign keys...'));
  await db.run('PRAGMA foreign_keys = ON');

  console.log(chalk.cyan('Creating circuits table...'));
  await db.run(
    `CREATE TABLE IF NOT EXISTS circuits (
      id INTEGER PRIMARY KEY,
      ref TEXT NOT NULL,
      name TEXT NOT NULL,
      location TEXT NOT NULL,
      country TEXT NOT NULL,
      lat REAL NOT NULL,
      lng REAL NOT NULL,
      alt INTEGER,
      url TEXT NOT NULL
    );`,
  );

  console.log(chalk.cyan('Creating constructors table...'));
  await db.run(
    `CREATE TABLE IF NOT EXISTS constructors (
      id INTEGER PRIMARY KEY,
      ref TEXT NOT NULL,
      name TEXT NOT NULL,
      nationality TEXT NOT NULL,
      url TEXT NOT NULL
    );`,
  );

  console.log(chalk.cyan('Creating drivers table...'));
  await db.run(
    `CREATE TABLE IF NOT EXISTS drivers (
      id INTEGER PRIMARY KEY,
      ref TEXT NOT NULL,
      number INTEGER,
      code TEXT,
      forename TEXT NOT NULL,
      surname TEXT NOT NULL,
      dob TEXT NOT NULL,
      nationality TEXT NOT NULL,
      url TEXT NOT NULL
    );`,
  );

  console.log(chalk.cyan('Creating seasons table...'));
  await db.run(
    `CREATE TABLE IF NOT EXISTS seasons (
      year INTEGER PRIMARY KEY,
      url TEXT NOT NULL
    );`,
  );

  console.log(chalk.cyan('Creating races table...'));
  await db.run(
    `CREATE TABLE IF NOT EXISTS races (
      id INTEGER PRIMARY KEY,
      year INTEGER NOT NULL,
      round INTEGER NOT NULL,
      circuit INTEGER NOT NULL,
      name TEXT NOT NULL,
      date TEXT NOT NULL,
      time TEXT,
      url TEXT NOT NULL,
      fp1_date TEXT,
      fp1_time TEXT,
      fp2_date TEXT,
      fp2_time TEXT,
      fp3_date TEXT,
      fp3_time TEXT,
      quali_date TEXT,
      quali_time TEXT,
      sprint_date TEXT,
      sprint_time TEXT,
      FOREIGN KEY (year) REFERENCES seasons(year),
      FOREIGN KEY (circuit) REFERENCES circuits(id)
    );`,
  );

  console.log(chalk.cyan('Creating status table...'));
  await db.run(
    `CREATE TABLE IF NOT EXISTS status (
      id INTEGER PRIMARY KEY,
      status TEXT NOT NULL
    );`,
  );

  console.log(chalk.cyan('Creating constructor results table...'));
  await db.run(
    `CREATE TABLE IF NOT EXISTS constructor_results (
      id INTEGER PRIMARY KEY,
      race INTEGER NOT NULL,
      constructor INTEGER NOT NULL,
      points REAL NOT NULL,
      status INTEGER,
      FOREIGN KEY(race) REFERENCES races(id),
      FOREIGN KEY(constructor) REFERENCES constructors(id)
    );`,
  );

  console.log(chalk.cyan('Creating constructor standings table...'));
  await db.run(
    `CREATE TABLE IF NOT EXISTS constructor_standings (
      id INTEGER PRIMARY KEY,
      race INTEGER NOT NULL,
      constructor INTEGER NOT NULL,
      points REAL NOT NULL,
      position INTEGER NOT NULL,
      position_text TEXT NOT NULL,
      wins INTEGER NOT NULL,
      FOREIGN KEY (race) REFERENCES races(id),
      FOREIGN KEY (constructor) REFERENCES constructors(id)
    );`,
  );

  console.log(chalk.cyan('Creating driver standings table...'));
  await db.run(
    `CREATE TABLE IF NOT EXISTS driver_standings (
      id INTEGER PRIMARY KEY,
      race INTEGER NOT NULL,
      driver INTEGER NOT NULL,
      points REAL NOT NULL,
      position INTEGER NOT NULL,
      position_text TEXT NOT NULL,
      wins INTEGER NOT NULL,
      FOREIGN KEY (race) REFERENCES races(id),
      FOREIGN KEY (driver) REFERENCES drivers(id)
    );`,
  );

  console.log(chalk.cyan('Creating lap times table...'));
  await db.run(
    `CREATE TABLE IF NOT EXISTS lap_times (
      race INTEGER NOT NULL,
      driver INTEGER NOT NULL,
      lap INTEGER NOT NULL,
      position INTEGER NOT NULL,
      time TEXT NOT NULL,
      milliseconds INTEGER NOT NULL,
      FOREIGN KEY (race) REFERENCES races(id),
      FOREIGN KEY (driver) REFERENCES drivers(id)
    );`,
  );

  console.log(chalk.cyan('Creating pit stops table...'));
  await db.run(
    `CREATE TABLE IF NOT EXISTS pit_stops (
      race INTEGER NOT NULL,
      driver INTEGER NOT NULL,
      stop INTEGER NOT NULL,
      lap INTEGER NOT NULL,
      time TEXT NOT NULL,
      duration TEXT NOT NULL,
      milliseconds INTEGER NOT NULL,
      FOREIGN KEY (race) REFERENCES races(id),
      FOREIGN KEY (driver) REFERENCES drivers(id)
    );`,
  );

  console.log(chalk.cyan('Creating qualifying sessions table...'));
  await db.run(
    `CREATE TABLE IF NOT EXISTS qualifying_sessions (
      id INTEGER PRIMARY KEY,
      race INTEGER NOT NULL,
      driver INTEGER NOT NULL,
      constructor INTEGER NOT NULL,
      number INTEGER NOT NULL,
      position INTEGER NOT NULL,
      q1 TEXT,
      q2 TEXT,
      q3 TEXT,
      FOREIGN KEY (race) REFERENCES races(id),
      FOREIGN KEY (driver) REFERENCES drivers(id),
      FOREIGN KEY (constructor) REFERENCES constructors(id)
    );`,
  );

  console.log(chalk.cyan('Creating race results table...'));
  await db.run(
    `CREATE TABLE IF NOT EXISTS race_results (
      id INTEGER PRIMARY KEY,
      race INTEGER NOT NULL,
      driver INTEGER NOT NULL,
      constructor INTEGER NOT NULL,
      number INTEGER,
      grid INTEGER NOT NULL,
      position INTEGER,
      position_text TEXT NOT NULL,
      position_order INTEGER NOT NULL,
      points REAL NOT NULL,
      laps INTEGER NOT NULL,
      time TEXT,
      milliseconds INTEGER,
      fastest_lap INTEGER,
      rank INTEGER,
      fastest_lap_time TEXT,
      fastest_lap_speed REAL,
      status INTEGER NOT NULL,
      FOREIGN KEY (race) REFERENCES races(id),
      FOREIGN KEY (driver) REFERENCES drivers(id),
      FOREIGN KEY (constructor) REFERENCES constructors(id)
    );`,
  );

  console.log(chalk.cyan('Creating sprint results table...'));
  await db.run(
    `CREATE TABLE IF NOT EXISTS sprint_results (
      id INTEGER PRIMARY KEY,
      race INTEGER NOT NULL,
      driver INTEGER NOT NULL,
      constructor INTEGER NOT NULL,
      number INTEGER NOT NULL,
      grid INTEGER NOT NULL,
      position INTEGER,
      position_text TEXT NOT NULL,
      position_order INTEGER NOT NULL,
      points REAL NOT NULL,
      laps INTEGER NOT NULL,
      time TEXT,
      milliseconds INTEGER,
      fastest_lap INTEGER,
      fastest_lap_time TEXT,
      status INTEGER NOT NULL,
      FOREIGN KEY (race) REFERENCES races(id),
      FOREIGN KEY (driver) REFERENCES drivers(id),
      FOREIGN KEY (constructor) REFERENCES constructors(id)
    );`,
  );

  const parserConfig = {
    columns: true,
    // eslint-disable-next-line camelcase
    skip_empty_lines: true,
    // Need to convert \N to null
    // eslint-disable-next-line camelcase
    on_record: (record: Record<string, string | null>) => {
      const keys = Object.keys(record);

      for (const key of keys) {
        if (record[key] === '\\N') {
          // eslint-disable-next-line no-param-reassign
          record[key] = null;
        }
      }

      return record;
    },
  };

  // Read circuits data and insert into database
  console.log(chalk.cyan('Reading circuits data...'));
  const circuitParser = parse(
    await readFile(join(__dirname, 'csv', 'circuits.csv')),
    parserConfig,
  );

  let circuitCount = 0;
  for await (const record of circuitParser) {
    const circuit = circuitSchema.parse(record);
    await db.run(
      'INSERT INTO circuits (id, ref, name, location, country, lat, lng, alt, url) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        circuit.circuitId,
        circuit.circuitRef,
        circuit.name,
        circuit.location,
        circuit.country,
        circuit.lat,
        circuit.lng,
        circuit.alt,
        circuit.url,
      ],
    );
    circuitCount += 1;
    process.stdout.write(
      chalk.bold.hex('#40E0D0')(`\r${circuitCount} records inserted`),
    );
  }
  process.stdout.write('\n');

  // Read constructors data and insert into database
  console.log(chalk.cyan('Reading constructors data...'));
  const constructorParser = parse(
    await readFile(join(__dirname, 'csv', 'constructors.csv')),
    parserConfig,
  );

  let constructorCount = 0;
  for await (const record of constructorParser) {
    const constructor = constructorSchema.parse(record);
    await db.run(
      'INSERT INTO constructors (id, ref, name, nationality, url) VALUES (?, ?, ?, ?, ?)',
      [
        constructor.constructorId,
        constructor.constructorRef,
        constructor.name,
        constructor.nationality,
        constructor.url,
      ],
    );
    constructorCount += 1;
    process.stdout.write(
      chalk.bold.hex('#40E0D0')(`\r${constructorCount} records inserted`),
    );
  }
  process.stdout.write('\n');

  // Read drivers data and insert into database
  console.log(chalk.cyan('Reading drivers data...'));
  const driverParser = parse(
    await readFile(join(__dirname, 'csv', 'drivers.csv')),
    parserConfig,
  );

  let driverCount = 0;
  for await (const record of driverParser) {
    const driver = driverSchema.parse(record);
    await db.run(
      `INSERT INTO drivers (
        id,
        ref,
        number,
        code,
        forename,
        surname,
        dob,
        nationality,
        url
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        driver.driverId,
        driver.driverRef,
        driver.number,
        driver.code,
        driver.forename,
        driver.surname,
        driver.dob,
        driver.nationality,
        driver.url,
      ],
    );
    driverCount += 1;
    process.stdout.write(
      chalk.bold.hex('#40E0D0')(`\r${driverCount} records inserted`),
    );
  }
  process.stdout.write('\n');

  // Read seasons data and insert into database
  console.log(chalk.cyan('Reading seasons data...'));
  const seasonParser = parse(
    await readFile(join(__dirname, 'csv', 'seasons.csv')),
    parserConfig,
  );

  let seasonCount = 0;
  for await (const record of seasonParser) {
    const season = seasonSchema.parse(record);
    await db.run('INSERT INTO seasons (year, url) VALUES (?, ?)', [
      season.year,
      season.url,
    ]);
    seasonCount += 1;
    process.stdout.write(
      chalk.bold.hex('#40E0D0')(`\r${seasonCount} records inserted`),
    );
  }
  process.stdout.write('\n');

  // Read races data and insert into database
  console.log(chalk.cyan('Reading races data...'));
  const raceParser = parse(
    await readFile(join(__dirname, 'csv', 'races.csv')),
    parserConfig,
  );

  let raceCount = 0;
  for await (const record of raceParser) {
    const race = raceSchema.parse(record);
    await db.run(
      `INSERT INTO races (
        id,
        year,
        round,
        circuit,
        name,
        date,
        time,
        url,
        fp1_date,
        fp1_time,
        fp2_date,
        fp2_time,
        fp3_date,
        fp3_time,
        quali_date,
        quali_time,
        sprint_date,
        sprint_time
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        race.raceId,
        race.year,
        race.round,
        race.circuitId,
        race.name,
        race.date,
        race.time,
        race.url,
        race.fp1_date,
        race.fp1_time,
        race.fp2_date,
        race.fp2_time,
        race.fp3_date,
        race.fp3_time,
        race.quali_date,
        race.quali_time,
        race.sprint_date,
        race.sprint_time,
      ],
    );
    raceCount += 1;
    process.stdout.write(
      chalk.bold.hex('#40E0D0')(`\r${raceCount} records inserted`),
    );
  }
  process.stdout.write('\n');

  // Read in status data and insert into database
  console.log(chalk.cyan('Reading status data...'));
  const statusParser = parse(
    await readFile(join(__dirname, 'csv', 'status.csv')),
    parserConfig,
  );

  let statusCount = 0;
  for await (const record of statusParser) {
    const status = statusSchema.parse(record);
    await db.run('INSERT INTO status (id, status) VALUES (?, ?)', [
      status.statusId,
      status.status,
    ]);
    statusCount += 1;
    process.stdout.write(
      chalk.bold.hex('#40E0D0')(`\r${statusCount} records inserted`),
    );
  }
  process.stdout.write('\n');

  // Read in constructor results data and insert into database
  console.log(chalk.cyan('Reading constructor results data...'));
  const constructorResultParser = parse(
    await readFile(join(__dirname, 'csv', 'constructor_results.csv')),
    parserConfig,
  );

  let constructorResultCount = 0;
  for await (const record of constructorResultParser) {
    const constructorResult = constructorResultSchema.parse(record);
    await db.run(
      `INSERT INTO constructor_results (
        id,
        race,
        constructor,
        points,
        status
      ) VALUES (?, ?, ?, ?, ?)`,
      [
        constructorResult.constructorResultsId,
        constructorResult.raceId,
        constructorResult.constructorId,
        constructorResult.points,
        constructorResult.status,
      ],
    );
    constructorResultCount += 1;
    process.stdout.write(
      chalk.bold.hex('#40E0D0')(`\r${constructorResultCount} records inserted`),
    );
  }
  process.stdout.write('\n');

  // Read in constructor standings data and insert into database
  console.log(chalk.cyan('Reading constructor standings data...'));
  const constructorStandingParser = parse(
    await readFile(join(__dirname, 'csv', 'constructor_standings.csv')),
    parserConfig,
  );

  let constructorStandingCount = 0;
  for await (const record of constructorStandingParser) {
    const constructorStanding = constructorStandingSchema.parse(record);
    await db.run(
      `INSERT INTO constructor_standings (
        id,
        race,
        constructor,
        points,
        position,
        position_text,
        wins
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        constructorStanding.constructorStandingsId,
        constructorStanding.raceId,
        constructorStanding.constructorId,
        constructorStanding.points,
        constructorStanding.position,
        constructorStanding.positionText,
        constructorStanding.wins,
      ],
    );
    constructorStandingCount += 1;
    process.stdout.write(
      chalk.bold.hex('#40E0D0')(
        `\r${constructorStandingCount} records inserted`,
      ),
    );
  }
  process.stdout.write('\n');

  // Read in driver standings data and insert into database
  console.log(chalk.cyan('Reading driver standings data...'));
  const driverStandingParser = parse(
    await readFile(join(__dirname, 'csv', 'driver_standings.csv')),
    parserConfig,
  );

  let driverStandingCount = 0;
  for await (const record of driverStandingParser) {
    const driverStanding = driverStandingSchema.parse(record);
    await db.run(
      `INSERT INTO driver_standings (
        id,
        race,
        driver,
        points,
        position,
        position_text,
        wins
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        driverStanding.driverStandingsId,
        driverStanding.raceId,
        driverStanding.driverId,
        driverStanding.points,
        driverStanding.position,
        driverStanding.positionText,
        driverStanding.wins,
      ],
    );
    driverStandingCount += 1;
    process.stdout.write(
      chalk.bold.hex('#40E0D0')(`\r${driverStandingCount} records inserted`),
    );
  }
  process.stdout.write('\n');

  // Read in pit stops data and insert into database
  console.log(chalk.cyan('Reading pit stops data...'));
  const pitStopParser = parse(
    await readFile(join(__dirname, 'csv', 'pit_stops.csv')),
    parserConfig,
  );

  let pitStopCount = 0;
  for await (const record of pitStopParser) {
    const pitStop = pitStopSchema.parse(record);
    await db.run(
      `INSERT INTO pit_stops (
        race,
        driver,
        stop,
        lap,
        time,
        duration,
        milliseconds
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        pitStop.raceId,
        pitStop.driverId,
        pitStop.stop,
        pitStop.lap,
        pitStop.time,
        pitStop.duration,
        pitStop.milliseconds,
      ],
    );
    pitStopCount += 1;
    process.stdout.write(
      chalk.bold.hex('#40E0D0')(`\r${pitStopCount} records inserted`),
    );
  }
  process.stdout.write('\n');

  // Read in qualifying sessions data and insert into database
  console.log(chalk.cyan('Reading qualifying sessions data...'));
  const qualifyingSessionParser = parse(
    await readFile(join(__dirname, 'csv', 'qualifying.csv')),
    parserConfig,
  );

  let qualifyingSessionCount = 0;
  for await (const record of qualifyingSessionParser) {
    const qualifyingSession = qualifyingSessionSchema.parse(record);
    await db.run(
      `INSERT INTO qualifying_sessions (
        id,
        race,
        driver,
        constructor,
        number,
        position,
        q1,
        q2,
        q3
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        qualifyingSession.qualifyId,
        qualifyingSession.raceId,
        qualifyingSession.driverId,
        qualifyingSession.constructorId,
        qualifyingSession.number,
        qualifyingSession.position,
        qualifyingSession.q1,
        qualifyingSession.q2,
        qualifyingSession.q3,
      ],
    );
    qualifyingSessionCount += 1;
    process.stdout.write(
      chalk.bold.hex('#40E0D0')(
        `\r${qualifyingSessionCount} records inserted`,
      ),
    );
  }
  process.stdout.write('\n');

  // Read in race results data and insert into database
  console.log(chalk.cyan('Reading race results data...'));
  const raceResultParser = parse(
    await readFile(join(__dirname, 'csv', 'results.csv')),
    parserConfig,
  );

  let raceResultCount = 0;
  for await (const record of raceResultParser) {
    const raceResult = raceResultSchema.parse(record);
    await db.run(
      `INSERT INTO race_results (
        id,
        race,
        driver,
        constructor,
        number,
        grid,
        position,
        position_text,
        position_order,
        points,
        laps,
        time,
        milliseconds,
        fastest_lap,
        rank,
        fastest_lap_time,
        fastest_lap_speed,
        status
        ) VALUES (
          ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
        )`,
      [
        raceResult.resultId,
        raceResult.raceId,
        raceResult.driverId,
        raceResult.constructorId,
        raceResult.number,
        raceResult.grid,
        raceResult.position,
        raceResult.positionText,
        raceResult.positionOrder,
        raceResult.points,
        raceResult.laps,
        raceResult.time,
        raceResult.milliseconds,
        raceResult.fastestLap,
        raceResult.rank,
        raceResult.fastestLapTime,
        raceResult.fastestLapSpeed,
        raceResult.statusId,
      ],
    );
    raceResultCount += 1;
    process.stdout.write(
      chalk.bold.hex('#40E0D0')(`\r${raceResultCount} records inserted`),
    );
  }
  process.stdout.write('\n');

  // Read in sprint results data and insert into database
  console.log(chalk.cyan('Reading sprint results data...'));
  const sprintResultParser = parse(
    await readFile(join(__dirname, 'csv', 'sprint_results.csv')),
    parserConfig,
  );

  let sprintResultCount = 0;
  for await (const record of sprintResultParser) {
    const sprintResult = sprintResultSchema.parse(record);
    await db.run(
      `INSERT INTO sprint_results (
        id,
        race,
        driver,
        constructor,
        number,
        grid,
        position,
        position_text,
        position_order,
        points,
        laps,
        time,
        milliseconds,
        fastest_lap,
        fastest_lap_time,
        status
        ) VALUES (
          ?, ?, ?, ?,
          ?, ?, ?, ?,
          ?, ?, ?, ?,
          ?, ?, ?, ?
        )`,
      [
        sprintResult.resultId,
        sprintResult.raceId,
        sprintResult.driverId,
        sprintResult.constructorId,
        sprintResult.number,
        sprintResult.grid,
        sprintResult.position,
        sprintResult.positionText,
        sprintResult.positionOrder,
        sprintResult.points,
        sprintResult.laps,
        sprintResult.time,
        sprintResult.milliseconds,
        sprintResult.fastestLap,
        sprintResult.fastestLapTime,
        sprintResult.statusId,
      ],
    );
    sprintResultCount += 1;
    process.stdout.write(
      chalk.bold.hex('#40E0D0')(`\r${sprintResultCount} records inserted`),
    );
  }
  process.stdout.write('\n');

  // Read in lap times data and insert into database
  console.log(chalk.cyan('Reading lap times data...'));
  const lapTimeParser = parse(
    await readFile(join(__dirname, 'csv', 'lap_times.csv')),
    parserConfig,
  );

  let lapTimeCount = 0;
  for await (const record of lapTimeParser) {
    const lapTime = lapTimeSchema.parse(record);
    await db.run(
      `INSERT INTO lap_times (
        race,
        driver,
        lap,
        position,
        time,
        milliseconds
      ) VALUES (?, ?, ?, ?, ?, ?)`,
      [
        lapTime.raceId,
        lapTime.driverId,
        lapTime.lap,
        lapTime.position,
        lapTime.time,
        lapTime.milliseconds,
      ],
    );
    lapTimeCount += 1;
    process.stdout.write(
      chalk.bold.hex('#40E0D0')(`\r${lapTimeCount} records inserted`),
    );
  }
  process.stdout.write('\n');

  // Create indexes (19,300,352 bytes (19.9 MB on disk) pre-indexing)
  console.log(chalk.cyan('Creating indexes...'));

  await db.run('CREATE INDEX circuit_ref ON circuits (ref);');
  await db.run('CREATE INDEX constructor_ref ON constructors (ref);');
  await db.run('CREATE INDEX driver_ref ON drivers (ref);');
  // 19,329,024 bytes (19.9 MB on disk) post-indexing

  // Create foreign key indexes
  console.log(chalk.cyan('Creating foreign key indexes...'));
  await db.run('CREATE INDEX races_by_year ON races (year);');
  await db.run('CREATE INDEX races_by_circuit ON races (circuit);');
  await db.run(
    'CREATE INDEX constructor_results_by_race ON constructor_results(race);',
  );
  await db.run(
    'CREATE INDEX constructor_results_by_constructor ON constructor_results(constructor);',
  );
  await db.run(
    'CREATE INDEX constructor_standings_by_race ON constructor_standings(race);',
  );
  await db.run(
    'CREATE INDEX constructor_standings_by_constructor ON constructor_standings (constructor);',
  );
  await db.run(
    'CREATE INDEX driver_standings_by_race ON driver_standings (race);',
  );
  await db.run(
    'CREATE INDEX driver_standings_by_driver ON driver_standings (driver);',
  );
  await db.run('CREATE INDEX lap_times_by_race ON lap_times (race);');
  await db.run('CREATE INDEX lap_times_by_driver ON lap_times (driver);');
  await db.run('CREATE INDEX pit_stops_by_race ON pit_stops (race);');
  await db.run('CREATE INDEX pit_stops_by_driver ON pit_stops (driver);');
  await db.run(
    'CREATE INDEX qualifying_sessions_by_race ON qualifying_sessions (race);',
  );
  await db.run(
    'CREATE INDEX qualifying_sessions_by_driver ON qualifying_sessions (driver);',
  );
  await db.run(
    'CREATE INDEX qualifying_session_by_constructor ON qualifying_sessions (constructor);',
  );
  await db.run('CREATE INDEX race_results_by_race ON race_results (race);');
  await db.run('CREATE INDEX race_results_by_driver ON race_results (driver);');
  await db.run(
    'CREATE INDEX race_results_by_constructor ON race_results (constructor);',
  );
  await db.run('CREATE INDEX sprint_results_by_race ON sprint_results (race);');
  await db.run(
    'CREATE INDEX sprint_results_by_driver ON sprint_results (driver);',
  );
  await db.run(
    'CREATE INDEX sprint_results_by_constructor ON sprint_results (constructor);',
  );
} catch (error) {
  console.error(chalk.red(error));
  console.info(chalk.yellow('Deleting WIP database...'));
  process.exit(1);
}