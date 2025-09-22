const settingsController = {
  paymentMethods: (_req, res) => {
    try {
      const methods = [
        { value: 'dinheiro', label: 'Dinheiro' },
        { value: 'pix', label: 'PIX' },
        { value: 'cartao', label: 'Cartão' },
      ];
      return res.status(200).json(methods);
    } catch (error) {
      console.error("Erro ao buscar métodos de pagamento:", error);
      return res.status(500).json({ message: "Erro ao buscar métodos de pagamento." });
    }
  },
};

export default settingsController;


