// lib/database/tables/configuracoes.dart

import 'package:drift/drift.dart';

class Configuracoes extends Table {
  IntColumn get id => integer().autoIncrement()();

  TextColumn get congregacao => text().withDefault(const Constant(''))();

  TextColumn get circuito => text().withDefault(const Constant(''))();

  TextColumn get idioma => text().withDefault(const Constant('pt_BR'))();

  TextColumn get tema => text().withDefault(const Constant('system'))();
  // system | light | dark

  BoolColumn get notificacoes =>
      boolean().withDefault(const Constant(true))();

  BoolColumn get importarAutomaticamente =>
      boolean().withDefault(const Constant(true))();

  BoolColumn get monitorarCompartilhamentos =>
      boolean().withDefault(const Constant(true))();

  BoolColumn get enviarWhatsappAutomaticamente =>
      boolean().withDefault(const Constant(false))();

  BoolColumn get confirmarAntesEnviar =>
      boolean().withDefault(const Constant(true))();

  BoolColumn get salvarHistorico =>
      boolean().withDefault(const Constant(true))();

  BoolColumn get backupAutomatico =>
      boolean().withDefault(const Constant(true))();

  TextColumn get pastaBackup =>
      text().withDefault(const Constant(''))();

  TextColumn get telefonePadrao =>
      text().withDefault(const Constant(''))();

  TextColumn get mensagemPadrao => text().withDefault(
        const Constant(
          'Olá! Segue em anexo sua designação desta semana. Tenha uma excelente reunião!',
        ),
      )();

  DateTimeColumn get criadoEm =>
      dateTime().withDefault(currentDateAndTime)();

  DateTimeColumn get atualizadoEm =>
      dateTime().withDefault(currentDateAndTime)();
}
