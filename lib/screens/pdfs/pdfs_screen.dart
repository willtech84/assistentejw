// lib/screens/pdfs/pdfs_screen.dart

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../providers/database_provider.dart';

class PdfsScreen extends ConsumerWidget {
  const PdfsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final db = ref.watch(databaseProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text("PDFs"),
      ),
      body: FutureBuilder(
        future: db.select(db.pdfsRecebidos).get(),
        builder: (context, snapshot) {
          if (!snapshot.hasData) {
            return const Center(
              child: CircularProgressIndicator(),
            );
          }

          final lista = snapshot.data!;

          return ListView.builder(
            itemCount: lista.length,
            itemBuilder: (_, i) {
              final pdf = lista[i];

              return ListTile(
                leading: const Icon(Icons.picture_as_pdf),
                title: Text(pdf.estudante),
                subtitle: Text(pdf.nomeArquivo),
                trailing: Icon(
                  pdf.enviadoWhatsapp
                      ? Icons.check_circle
                      : Icons.schedule,
                ),
              );
            },
          );
        },
      ),
    );
  }
}
