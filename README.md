# F1Flat

This is a tool that takes the data used by the [Ergast Developer API](http://ergast.com/mrd/) and generates a flat file of Formula One data consisting of a SQLite database.

This repo has scripts for deploying this database as a Lambda Layer for use in AWS Lambda functions.

## Why?

Instead of being concerned with caching and managing the Ergast Developer API, you can just use this Lambda Layer and get the data you need without worrying about any other infrastructure like a conventional DBMS.

The output SQLite database is ~30MB (with indexes) uncompressed and ~10MB compressed. This is about as large a database as you can reasonably deploy as a Lambda Layer.

Consider this a very specific solution to very specific problem. That said, this could be a useful tool/pattern for anyone building a hobby project.

## Usage

### Lambda Layer

The Lambda Layer is built from CSV data into a SQLite database. The database is then compressed into a zip file and deployed with AWS CDK. The Lambda Layer is then deployed to my AWS account. You'll need to configure your own AWS account and deploy the Lambda Layer yourself. A SAR for this does not currently exist.

### Types

The types and Zod schemas are in `packages/f1flat_types` and published as `@jgrosspietsch/f1flat_types` to Github Packages. These schemas can be used to validate the data returned from the database as well as the responses from an API that uses this database.