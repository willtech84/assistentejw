import 'package:flutter/material.dart';

class SobreScreen extends StatelessWidget {

  const SobreScreen({super.key});

  @override
  Widget build(BuildContext context) {

    return Scaffold(
      appBar: AppBar(
        title: const Text("Sobre"),
      ),
      body: const Center(
        child: Text("Assistente JW\nVersão 1.0"),
      ),
    );
  }
}
