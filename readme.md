# Automated Remote MongoDB Backup Tool
This open source tool is used to backup a MongoDB database on a remote server your local system. It is
designed to be completely automated, and should be run through Daemeon or PM2 (NPM Libary for managing Node processes).

## Where are my backups stored?
All backups are compressed, and stored inside the backups directory within the codebase.

## How often is my database backed up?
For now, your database will be backed up Nightly (00:00 Hours PC time). 

## Additional monitoring features
Each time your database is backed up, you will receive an email confirmation with a log of the events. If there is an issue with the backup process, you will also be notified via Email. Please ensure that you add your email address into the configuration file. 

## Installation
Simply rename the config.sample.json to config.json, and complete the file.

## Pull Requests
I am completely open to pull requests, and will aprove them. Please help support this, as its much needed with MongoDB's poor authentication!
