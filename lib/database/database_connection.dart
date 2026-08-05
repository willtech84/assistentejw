// lib/database/database_connection.dart

import 'dart:io';

import 'package:drift/drift.dart';
import 'package:drift/native.dart';
import 'package:path/path.dart' as p;
import 'package:path_provider/path_provider.dart';

LazyDatabase openConnection() {
  return LazyDatabase(() async {
    final appDir = await getApplicationDocumentsDirectory();

    final dbFolder = Directory(
      p.join(appDir.path, "database"),
    );

    if (!await dbFolder.exists()) {
      await dbFolder.create(recursive: true);
    }

    final file = File(
      p.join(
        dbFolder.path,
        "assistentejw.db",
      ),
    );

    return NativeDatabase(
      file,
      logStatements: false,
    );
  });
}
