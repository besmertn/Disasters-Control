let mysql = require('mysql'),
    errorGenerator = require('../error-generator');

function sqlRequest(options) {
  this.connection = options.connection;

  this.request = function (options, done, toAnswer) {
    let connection = mysql.createConnection(this.connection);

    connection.query(options.query, options.variables, function (error, result) {
      connection.end();
      return done(answerConstructor(options, error, result, toAnswer));
    });
  };

  this.getAccountTables = function (data, done) {
    new Promise((resolve, reject) => {
      this.request({
        query: `SELECT * 
                FROM Device
                WHERE user_id = ?`,
        variables: [data.id],
        title: "selectDevices"
      }, function (answer) {
        resolve(answer)
      });
    }).then(answer => {
      this.request({
        query: `SELECT *, DATE_FORMAT(time,'%k:%i, %d.%m.%Y') as time
                FROM Disasters
                WHERE user_id = ?`,
        variables: [data.id],
        title: "selectDisasters"}, done, answer);
    });
  };

  this.getGlobalData = function (done) {
    new Promise((resolve, reject) => {
      this.request({
        query: `SELECT *
                FROM Device
                WHERE magnitude > Device.avg_magnitude OR temperature > Device.avg_temperature OR water_level > Device.avg_water_level
                OR gamma_rays > Device.avg_gamma_rays`,
        title: "selectDevice"
      }, function (answer) {
        resolve(answer)
      });
    }).then(answer => {
      return new Promise((resolve, reject) => {
        this.request({
          query: `SELECT *
                  FROM Disasters
                  WHERE confirmed IS NOT NULL`,
          title: "selectDisaster"
        }, function (answer) {
          resolve(answer)
        }, answer);
      });
    }).then(answer => {
      this.request({
        query: `SELECT *
                FROM RescueBase`,
        title: "selectBase"
      }, done, answer);
    });
  };

  this.getUser = function (data, done) {
    this.request({
      query: `SELECT *
                FROM User U
                WHERE (U.mail = ? AND U.password = ?) OR U.id=?`,
      variables: [data.mail, data.password, data.id],
      title: "selectUser"
    }, function (answer) {
      done(getResultFromAnswer(answer.result, "selectUser")[0]);
    });
  };

  this.setUser = function (data, done) {
    new Promise((resolve, reject) => {
      this.request({
        query: `SELECT *
              FROM User U
              WHERE U.mail = ?`,
        variables: [data.mail],
        title: "selectUser"
      }, function (answer) {
        resolve(answer)
      });
    }).then(answer => {
      let user = getResultFromAnswer(answer.result, "selectUser")[0];

      if(user !== undefined)
        return done(errorGenerator.registrationError(answer.result));

      return new Promise((resolve, reject) => {
        this.request({
          query: `INSERT INTO User (mail, password)
                VALUES (?,?)`,
          variables: [data.mail, data.password],
          title: "insertUser"
        }, function (answer) {
          resolve(answer)
        }, answer);
      });

    }).then(answer => {
      let result = getResultFromAnswer(answer.result, "insertUser");
      if(result.affectedRows != 1)
        return done(errorGenerator.dataBaseCriticalError(answer.result));

      this.getUser({id: result.insertId}, done);
    });
  };

  this.isModerator = function (data, done) {
    this.request({
      query: `SELECT *
              FROM Moderation
              WHERE user_id = ?`,
      variables: [data.id],
      title: "selectModerator"
    }, function (answer) {
      if(getResultFromAnswer(answer.result, "selectModerator").length > 0)
        return done(true);
      return done(false);
    });
  };

  this.getModerationData = function (done) {
    this.request({
      query: `SELECT * FROM Disasters WHERE confirmed IS NULL`,
      title: "selectDisasters"
    }, done);
  };

  this.addDevice = function (data, done) {
    new Promise((resolve, reject) => {
      this.request({
        query: `INSERT INTO Device (user_id, location)
                VALUES (?, ?);`,
        variables: [data.userId, data.location],
        title: "insertDevice"
      }, function (answer) {
        resolve(answer)
      });
    }).then(answer => {
      let deviceId = getResultFromAnswer(answer.result, "insertDevice");

      if(deviceId.affectedRows !== undefined && deviceId.affectedRows != 1 )
        return done(errorGenerator.dataBaseCriticalError(answer.result));

      this.request({
        query: `SELECT * FROM Device WHERE id = ?`,
        variables: [deviceId.insertId],
        title: "selectAnswer"
      }, done, answer);
    });
  };

  this.addDisaster = function (data, done) {
    new Promise((resolve, reject) => {
      this.request({
        query: `INSERT INTO Disasters (user_id, location, context, dimension, time)
                VALUES (?, ?, ?, ?, NOW());`,
        variables: [data.userId, data.location, data.describe, data.dimension],
        title: "insertDisaster"
      }, function (answer) {
        resolve(answer)
      });
    }).then(answer => {
      let disasterId = getResultFromAnswer(answer.result, "insertDisaster");

      if(disasterId.affectedRows !== undefined && disasterId.affectedRows != 1 )
        return done(errorGenerator.dataBaseCriticalError(answer.result));

      this.request({
        query: `SELECT *, DATE_FORMAT(time,'%k:%i, %d.%m.%Y') as time
                FROM Disasters WHERE id = ?`,
        variables: [disasterId.insertId],
        title: "selectAnswer"
      }, done, answer);
    });
  };

  this.deleteDevice = function (data, done) {
    this.request({
      query: `DELETE FROM Device
              WHERE id = ? AND user_id = ?`,
      variables: [data.id, data.userId],
      title: "deleteDevice"
    }, done);
  };

  this.deleteDisaster = function (data, done) {
    this.request({
      query: `DELETE FROM Disasters
              WHERE id = ? AND user_id = ?`,
      variables: [data.id, data.userId],
      title: "deleteDisaster"
    }, done);
  };

  this.confirmDisaster = function (data, done) {
    this.request({
      query: `UPDATE Disasters
              SET confirmed = 1
              WHERE id = ?`,
      variables: [data.id],
      title: "selectAnswer"
    }, done);
  };

  this.setDeviceData = function (data, done) {
    this.request({
      query: `UPDATE Device
              SET magnitude = ?, temperature = ?, water_level  = ?, gamma_rays = ?
              WHERE id = ?;`,
      variables: [data.data[0], data.data[1], data.data[2], data.data[3], data.moduleId],
      title: "setDeviceData"
    }, done);
  };

  this.getDeviceSettings = function (data, done) {
    this.request({
      query: `SELECT avg_gamma_rays, avg_water_level, avg_temperature, avg_magnitude
              FROM Device WHERE id = ?`,
      variables: [data.moduleId],
      title: "getDeviceSettings"
    }, done);
  };
}

function answerConstructor(options, error, result, toAnswer = {error: null, result: []}) {
  toAnswer.result.push({
    title: options.title,
    data: options.isParse ? JSON.stringify(result) : result
  });

  if(toAnswer){
    return {
      error: toAnswer.error === null? error: toAnswer.error,
      result: toAnswer.result
    }
  }

  return {
    error: error,
    result: toAnswer.result
  }
}

function getResultFromAnswer(answer, title) {
  for(let i = 0; i < answer.length; i++){
    if(answer[i].title == title)
      return answer[i].data;
  }
  return false;
}



module.exports = sqlRequest;