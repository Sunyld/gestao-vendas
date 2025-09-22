import PDFDocument from "pdfkit";
import ExcelJS from "exceljs";
import { query } from "../utils/db.js";

const reportsController = {
  dashboard: async (_req, res) => {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - 6);

      const [salesData, categoryData] = await Promise.all([
        query(
          `SELECT DATE_FORMAT(sale_date, '%Y-%m-%d') as date, SUM(total) as total 
           FROM sales 
           WHERE sale_date BETWEEN ? AND ?
           GROUP BY DATE(sale_date) 
           ORDER BY sale_date ASC`,
          [startDate.toISOString().split('T')[0], endDate.toISOString().split('T')[0]]
        ),
        query(
          `SELECT p.category, SUM(s.total) as total
           FROM sales s
           JOIN products p ON s.product_id = p.id
           WHERE s.sale_date BETWEEN ? AND ?
           GROUP BY p.category`,
          [startDate.toISOString().split('T')[0], endDate.toISOString().split('T')[0]]
        )
      ]);

      const dateLabels = [];
      for (let i = 0; i < 7; i++) {
        const date = new Date();
        date.setDate(date.getDate() - (6 - i));
        dateLabels.push(date.toLocaleDateString('pt-BR', { weekday: 'short' }));
      }

      const salesByDay = Array(7).fill(0);
      salesData.forEach(sale => {
        const saleDate = new Date(sale.date);
        const dayIndex = Math.floor((saleDate - startDate) / (1000 * 60 * 60 * 24));
        if (dayIndex >= 0 && dayIndex < 7) {
          salesByDay[dayIndex] = parseFloat(sale.total);
        }
      });

      const categories = categoryData.map(item => item.category || "Outros");
      const categoryTotals = categoryData.map(item => parseFloat(item.total));

      const summary = await query(
        `SELECT 
           COUNT(*) as totalSales, 
           SUM(total) as totalRevenue, 
           AVG(total) as averageTicket,
           SUM(total * 0.35) as netProfit
         FROM sales
         WHERE sale_date BETWEEN ? AND ?`,
        [startDate.toISOString().split('T')[0], endDate.toISOString().split('T')[0]]
      );

      const result = {
        totalSales: summary[0].totalSales || 0,
        totalRevenue: parseFloat(summary[0].totalRevenue) || 0,
        averageTicket: parseFloat(summary[0].averageTicket) || 0,
        netProfit: parseFloat(summary[0].netProfit) || 0,
        salesLast7Days: { labels: dateLabels, data: salesByDay },
        salesByCategory: { labels: categories, data: categoryTotals },
      };

      return res.status(200).json(result);
    } catch (error) {
      console.error("Erro ao carregar dashboard:", error);
      return res.status(500).json({ message: "Erro ao carregar dashboard." });
    }
  },

  reports: async (req, res) => {
    try {
      const { start, end } = req.query;
      if (!start || !end) {
        return res.status(400).json({ message: "Datas de início e fim são obrigatórias." });
      }

      const [dailySales, categorySales, topProducts, financialSummary, paymentMethods, stockMovements] = await Promise.all([
        query(
          `SELECT DATE_FORMAT(s.sale_date, '%Y-%m-%d') as label, SUM(s.total) as value 
           FROM sales s 
           WHERE s.sale_date BETWEEN ? AND ? 
           GROUP BY DATE(s.sale_date) 
           ORDER BY s.sale_date ASC`,
          [start, end]
        ),
        query(
          `SELECT p.category AS label, SUM(s.total) AS value 
           FROM sales s 
           JOIN products p ON s.product_id = p.id 
           WHERE s.sale_date BETWEEN ? AND ? 
           GROUP BY p.category`,
          [start, end]
        ),
        query(
          `SELECT p.name AS label, COUNT(*) AS value 
           FROM sales s 
           JOIN products p ON s.product_id = p.id 
           WHERE s.sale_date BETWEEN ? AND ? 
           GROUP BY p.name 
           ORDER BY value DESC 
           LIMIT 5`,
          [start, end]
        ),
        (async () => {
          const currentResult = await query(
            `SELECT
               SUM(s.total) AS totalRevenue,
               AVG(s.total) AS averageTicket,
               COUNT(*) AS totalSales,
               SUM(s.total * 0.35) AS netProfit
             FROM sales s 
             WHERE s.sale_date BETWEEN ? AND ?`,
            [start, end]
          );

          const previousResult = await query(
            `SELECT
               SUM(s.total) AS totalRevenue,
               AVG(s.total) AS averageTicket,
               COUNT(*) AS totalSales,
               SUM(s.total * 0.35) AS netProfit
             FROM sales s 
             WHERE s.sale_date BETWEEN DATE_SUB(?, INTERVAL DATEDIFF(?, ?) DAY) AND ?`,
            [start, end, start, start]
          );

          const current = currentResult[0] || { totalRevenue: 0, averageTicket: 0, totalSales: 0, netProfit: 0 };
          const previous = previousResult[0] || { totalRevenue: 0, averageTicket: 0, totalSales: 0, netProfit: 0 };
          const calculateGrowth = (currentVal, previousVal) => {
            if (!previousVal || previousVal === 0) return 100;
            return +(((currentVal - previousVal) / previousVal) * 100).toFixed(2);
          };
          return {
            totalRevenue: +current.totalRevenue || 0,
            averageTicket: +current.averageTicket || 0,
            totalSales: +current.totalSales || 0,
            netProfit: +current.netProfit || 0,
            growthRevenuePercent: calculateGrowth(+current.totalRevenue, +previous.totalRevenue),
            growthTicketPercent: calculateGrowth(+current.averageTicket, +previous.averageTicket),
            growthSalesPercent: calculateGrowth(+current.totalSales, +previous.totalSales),
            growthProfitPercent: calculateGrowth(+current.netProfit, +previous.netProfit),
          };
        })(),
        query(
          `SELECT payment_method, SUM(total) as total 
           FROM sales 
           WHERE sale_date BETWEEN ? AND ?
           GROUP BY payment_method`,
          [start, end]
        ),
        query(
          `SELECT sm.type AS label, SUM(sm.quantity) AS value 
           FROM stock_movements sm 
           WHERE sm.created_at BETWEEN ? AND ? 
           GROUP BY sm.type`,
          [start, end]
        ),
      ]);

      return res.status(200).json({
        dailySales: { labels: dailySales.map((r) => r.label), data: dailySales.map((r) => +r.value) },
        categorySales: { labels: categorySales.map((r) => r.label || "Sem Categoria"), data: categorySales.map((r) => +r.value) },
        topProducts: { labels: topProducts.map((r) => r.label), data: topProducts.map((r) => +r.value) },
        paymentMethods: { labels: paymentMethods.map((r) => r.payment_method), data: paymentMethods.map((r) => +r.total) },
        stockMovements: { labels: stockMovements.map((r) => r.label), data: stockMovements.map((r) => +r.value) },
        financialSummary,
      });
    } catch (error) {
      console.error("Erro ao gerar relatório:", error);
      return res.status(500).json({ message: "Erro ao gerar relatório." });
    }
  },

  exportReport: async (req, res) => {
    try {
      const { start, end, format } = req.query;
      if (!start || !end || !['pdf', 'excel'].includes(format)) {
        return res.status(400).json({ message: "Parâmetros inválidos." });
      }

      const [dailySales, categorySales, topProducts, financialSummary, paymentMethods, stockMovements] = await Promise.all([
        query(
          `SELECT DATE_FORMAT(s.sale_date, '%Y-%m-%d') as label, SUM(s.total) as value 
           FROM sales s 
           WHERE s.sale_date BETWEEN ? AND ? 
           GROUP BY DATE(s.sale_date) 
           ORDER BY s.sale_date ASC`,
          [start, end]
        ),
        query(
          `SELECT p.category AS label, SUM(s.total) AS value 
           FROM sales s 
           JOIN products p ON s.product_id = p.id 
           WHERE s.sale_date BETWEEN ? AND ? 
           GROUP BY p.category`,
          [start, end]
        ),
        query(
          `SELECT p.name AS label, COUNT(*) AS value 
           FROM sales s 
           JOIN products p ON s.product_id = p.id 
           WHERE s.sale_date BETWEEN ? AND ? 
           GROUP BY p.name 
           ORDER BY value DESC 
           LIMIT 5`,
          [start, end]
        ),
        query(
          `SELECT
             SUM(s.total) AS totalRevenue,
             AVG(s.total) AS averageTicket,
             COUNT(*) AS totalSales,
             SUM(s.total * 0.35) AS netProfit
           FROM sales s 
           WHERE s.sale_date BETWEEN ? AND ?`,
          [start, end]
        ),
        query(
          `SELECT payment_method, SUM(total) as total 
           FROM sales 
           WHERE sale_date BETWEEN ? AND ?
           GROUP BY payment_method`,
          [start, end]
        ),
        query(
          `SELECT sm.type AS label, SUM(sm.quantity) AS value 
           FROM stock_movements sm 
           WHERE sm.created_at BETWEEN ? AND ? 
           GROUP BY sm.type`,
          [start, end]
        ),
      ]);

      if (format === 'pdf') {
        const doc = new PDFDocument();
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=relatorio_vendas_${start}_a_${end}.pdf`);
        doc.pipe(res);

        doc.fontSize(16).text('Relatório de Vendas', { align: 'center' });
        doc.fontSize(12).text(`Período: ${start} até ${end}`, { align: 'center' });
        doc.moveDown();

        doc.fontSize(14).text('Resumo Financeiro');
        doc.moveDown(0.5);
        doc.fontSize(10).text(`Faturamento Total: R$ ${financialSummary[0].totalRevenue.toFixed(2)}`);
        doc.text(`Ticket Médio: R$ ${financialSummary[0].averageTicket.toFixed(2)}`);
        doc.text(`Total de Vendas: ${financialSummary[0].totalSales}`);
        doc.text(`Lucro Líquido: R$ ${financialSummary[0].netProfit.toFixed(2)}`);
        doc.moveDown();

        doc.fontSize(14).text('Vendas por Período');
        doc.moveDown(0.5);
        doc.fontSize(10);
        dailySales.forEach((sale) => {
          doc.text(`${sale.label}: R$ ${sale.value.toFixed(2)}`);
        });
        doc.moveDown();

        doc.fontSize(14).text('Vendas por Categoria');
        doc.moveDown(0.5);
        categorySales.forEach((cat) => {
          doc.text(`${cat.label || 'Sem Categoria'}: R$ ${cat.value.toFixed(2)}`);
        });
        doc.moveDown();

        doc.fontSize(14).text('Produtos Mais Vendidos');
        doc.moveDown(0.5);
        topProducts.forEach((prod) => {
          doc.text(`${prod.label}: ${prod.value} unidades`);
        });
        doc.moveDown();

        doc.fontSize(14).text('Movimentações de Estoque');
        doc.moveDown(0.5);
        stockMovements.forEach((mov) => {
          doc.text(`${mov.label}: ${mov.value} unidades`);
        });

        doc.end();
      } else if (format === 'excel') {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Relatório de Vendas');

        worksheet.mergeCells('A1:B1');
        worksheet.getCell('A1').value = 'Relatório de Vendas';
        worksheet.getCell('A1').font = { bold: true, size: 16 };
        worksheet.getCell('A1').alignment = { horizontal: 'center' };

        worksheet.mergeCells('A2:B2');
        worksheet.getCell('A2').value = `Período: ${start} até ${end}`;
        worksheet.getCell('A2').alignment = { horizontal: 'center' };
        worksheet.addRow([]);

        worksheet.addRow(['Resumo Financeiro']);
        worksheet.getCell('A3').font = { bold: true, size: 14 };
        worksheet.addRow(['Faturamento Total', `R$ ${financialSummary[0].totalRevenue.toFixed(2)}`]);
        worksheet.addRow(['Ticket Médio', `R$ ${financialSummary[0].averageTicket.toFixed(2)}`]);
        worksheet.addRow(['Total de Vendas', financialSummary[0].totalSales]);
        worksheet.addRow(['Lucro Líquido', `R$ ${financialSummary[0].netProfit.toFixed(2)}`]);
        worksheet.addRow([]);

        worksheet.addRow(['Vendas por Período']);
        worksheet.getCell('A8').font = { bold: true, size: 14 };
        worksheet.addRow(['Data', 'Valor']);
        dailySales.forEach((sale) => {
          worksheet.addRow([sale.label, sale.value]);
        });
        worksheet.addRow([]);

        worksheet.addRow(['Vendas por Categoria']);
        worksheet.getCell(`A${worksheet.rowCount}`).font = { bold: true, size: 14 };
        worksheet.addRow(['Categoria', 'Valor']);
        categorySales.forEach((cat) => {
          worksheet.addRow([cat.label || 'Sem Categoria', cat.value]);
        });
        worksheet.addRow([]);

        worksheet.addRow(['Produtos Mais Vendidos']);
        worksheet.getCell(`A${worksheet.rowCount}`).font = { bold: true, size: 14 };
        worksheet.addRow(['Produto', 'Unidades Vendidas']);
        topProducts.forEach((prod) => {
          worksheet.addRow([prod.label, prod.value]);
        });
        worksheet.addRow([]);

        worksheet.addRow(['Movimentações de Estoque']);
        worksheet.getCell(`A${worksheet.rowCount}`).font = { bold: true, size: 14 };
        worksheet.addRow(['Tipo', 'Quantidade']);
        stockMovements.forEach((mov) => {
          worksheet.addRow([mov.label, mov.value]);
        });

        worksheet.columns.forEach((column) => {
          column.width = 25;
          column.alignment = { horizontal: 'left' };
        });

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=relatorio_vendas_${start}_a_${end}.xlsx`);

        await workbook.xlsx.write(res);
        res.end();
      }
    } catch (error) {
      console.error("Erro ao exportar relatório:", error);
      return res.status(500).json({ message: "Erro ao exportar relatório." });
    }
  },
};

export default reportsController;


