/**
 * WorkManager (used by expo-background-task for the mascot icon check) creates its Room
 * database with WorkDatabase_Impl's no-arg constructor via reflection. Room 2.6's own rule
 * keeps the class but not the constructor, and R8 full mode then strips it: the release app
 * crashes at startup in androidx.startup.InitializationProvider. Keep the constructor.
 */
const fs = require('fs');
const path = require('path');
const { withDangerousMod } = require('expo/config-plugins');

const RULE = '-keep class * extends androidx.room.RoomDatabase { <init>(); }';

module.exports = (config) =>
  withDangerousMod(config, [
    'android',
    async (config) => {
      const file = path.join(config.modRequest.platformProjectRoot, 'app', 'proguard-rules.pro');
      const src = fs.readFileSync(file, 'utf8');
      if (!src.includes(RULE)) {
        fs.writeFileSync(file, `${src.trimEnd()}\n\n# WorkManager's Room database (expo-background-task)\n${RULE}\n`);
      }
      return config;
    },
  ]);
