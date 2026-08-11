import 'package:flutter/material.dart';

class ShareReceiverScreen extends StatelessWidget {

  const ShareReceiverScreen({super.key});

  @override
  Widget build(BuildContext context) {

    return Scaffold(
      appBar: AppBar(
        title: const Text("PDF Recebidos"),
      ),
      body: const Center(
        child: Text("Aguardando compartilhamentos..."),
      ),
    );
  }
}
