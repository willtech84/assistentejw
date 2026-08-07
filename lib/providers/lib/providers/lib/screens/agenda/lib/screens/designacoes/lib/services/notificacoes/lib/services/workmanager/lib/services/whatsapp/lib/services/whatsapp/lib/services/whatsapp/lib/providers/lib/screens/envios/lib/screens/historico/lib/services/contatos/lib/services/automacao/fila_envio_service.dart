// lib/services/automacao/fila_envio_service.dart

import '../../database/database.dart';
import '../whatsapp/envio_service.dart';

class FilaEnvioService {
  final AppDatabase db;

  FilaEnvioService(this.db);

  Future<void> processarFila() async {
    final pendentes = await (db.select(db.pdfsRecebidos)
          ..where((t) => t.enviadoWhatsapp.equals(false)))
        .get();

    final envio = EnvioService(db);

    for (final pdf in pendentes) {
      await envio.enviar(pdf);
    }
  }
}
