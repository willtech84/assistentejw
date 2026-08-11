// lib/providers/whatsapp_provider.dart

import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../services/whatsapp/envio_service.dart';
import 'database_provider.dart';

final whatsappProvider =
    Provider<EnvioService>((ref) {
  return EnvioService(
    ref.watch(databaseProvider),
  );
});
