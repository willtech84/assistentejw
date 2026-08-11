// lib/screens/envios/envios_screen.dart

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../providers/database_provider.dart';
import '../../providers/whatsapp_provider.dart';

class EnviosScreen extends ConsumerWidget {
  const EnviosScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final db = ref.watch(databaseProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Envios'),
      ),
      body: FutureBuilder(
        future: db.select(db.pdfsRecebidos).get(),
        builder: (_, snapshot) {
          if (!snapshot.hasData) {
            return const Center(
              child: CircularProgressIndicator(),
            );
          }

          final lista = snapshot.data!;

          return ListView.builder(
            itemCount: lista.length,
            itemBuilder: (_, index) {
              final pdf = lista[index];

              return Card(
                child: ListTile(
                  title: Text(pdf.estudante),
                  subtitle: Text(pdf.telefone),
                  trailing: IconButton(
                    icon: const Icon(Icons.send),
                    onPressed: () async {
                      await ref
                          .read(whatsappProvider)
                          .enviar(pdf);
                    },
                  ),
                ),
              );
            },
          );
        },
      ),
    );
  }
}
