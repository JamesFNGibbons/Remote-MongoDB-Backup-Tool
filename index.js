/**
 * This program is used to create a simple nightly backup of mongodb
 * 
 * 
 * Written by James Gibbons of Flip Multimedia <jgibbons@flipweb.co.uk>
 * @author James Gibbons <jgibbons@flipweb.co.uk>
 * 
 */


const agenda = require('agenda');
const fs = require('fs');
const nodemailer = require('nodemailer');
const mongodb = require('mongodb').MongoClient;
const exec = require('child_process').exec;

/**
 * Load the local config file.
 */
const config = require('./config.json');

class MongoDBBackup {

  /** 
   * Constructor used to load the configuration, and
   * establish a connection to both the Database server 
   * (as a test), and to the mail server for sending the
   * info emails.
   */
  constructor() {
    console.log('MongoDB Remote to Local DB Backup Tool.');
    
    // Test connection to the MongoDB server.
    const mongoConnectionString = `mongodb://${config.mongodb.username}:${config.mongodb.password}@${config.mongodb.host}:27017/${config.mongodb.db}`;     
    mongodb.connect(mongoConnectionString, (err, db) => {
      if(err) {
        throw err;
      }
      else if(db) {
        console.log('--> Established connection to remote server ' + config.mongodb.host);
      }
      else {
        throw '--> [ERROR] Could not establish connection to remote MongoDb server ' + config.mongodb.host;
      }
    });


    /** 
     * Connect to the email server, using a one time
     * test accout that is provided for Free.
    */
    const testAccount = nodemailer.createTestAccount();
    this.mailTransporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false, // true for 465, false for other ports
      auth: {
          user: testAccount.user, // generated ethereal user
          pass: testAccount.pass // generated ethereal password
      }
    });

    console.log('--> Alert emails will be mailed to the following accounts: ');
    for(let email of config.alertEmails) {
      console.log('--- ---> ' + email);
    }

    /** 
     * Define the schedule event for the DB to be backed up
     * 
    */
    adgenda.define('nightly backup', (job, done) => {
      console.log('--> Attempting backup @ ' + new Date().toDateTimeString());
      this.createBackup();

      // Set to repeat every night at 12AM
      job.repeatEvery('24 hours');
      job.save();

      done();
    });

    /** 
     * Start the event scheduler, using the Adjenda.js
     * libary. 
    */
    agenda.start();
    angena.on('ready', () => {
      console.log('--> Event Schedule started. Ready to execute @ 00:00 Daily');
      agenda.schedule('everyday at 00:00','first');
    });
  }

  /** 
   * This function is used to create a backup of the
   * db, it will also work out the time that the backup
   * was created, and will save it to the backup directory.
  
   * @return {Promise Resolve} when the task has been completed.
   * @return {Promise Reject} if the task fails for any reason.
  */
  createBackup() {
    return new Promise((resolve, reject) => {
      
      // Execute mongodump to the tmp directory.
      const connectionString = `mongodb://${config.mongodb.username}:${config.mongodb.password}@${config.mongodb.host}:27017/${config.mongodb.db}`;
      const mongoDumpCmd = `mongodump --uri="${connectionString}" -o "./tmp"`;
      exec(mongoDumpCmd, (err, stdout, stderr) => {
        if(err) {
          throw err;
        }
        else if(!stderr){

          // Display the outpout of the MongoDump
          console.log('--> MongoDump Completed With: ');
          console.log('--> ' + stdout);
        }
        else {
          
          // Display the mongoDb dump error.
          console.error(stderr);

          /** 
           * Send an email to the alertable users with the dump
           * error attached to the message.
          */
          transporter.sendMail({
            // from: '"MongoDB Backup Service" <noreply@mongobackup.local>', // sender address
            to: config.alertEmails.toString(), // list of receivers
            subject: 'MongoDB Backup Failure On RemoteServer', // Subject line
            text: 'MongoDB auto backup failed on server. Output from MongoDB Dump - ' + stderr, // plain text body
            html: `
                <p><b>Dear Sys Admin</b></p>
                <p>MoongoDB backup failed on the remote server. Please find attached the log details for the event: </p>
                
                <p><b><u>Time of event</u></b> ${new Date().toDateTimeString()}</p>
                <p>${stderr}</p>
              ` // html body
          });

          throw 'Backup failed.';
        }

        /** 
         * Send the backup completed email to the system
         * administrators.
        */
        transporter.sendMail({
          // from: '"MongoDB Backup Service" <noreply@mongobackup.local>', // sender address
          to: config.alertEmails.toString(), // list of receivers
          subject: 'MongoDB Backup On RemoteServer', // Subject line
          text: 'MongoDB has been backed up. - ' + stderr, // plain text body
          html: `
              <p><b>Dear Sys Admin</b></p>
              <p>MoongoDB backup has been completed on the remote server. Please find event details below: </p>
              
              <p><b><u>Time of event</u></b> ${new Date().toDateTimeString()}</p>
              <p>${stdout}</p>
            `
        });
      });  
    });
  }


}

new MongoDBBackup();