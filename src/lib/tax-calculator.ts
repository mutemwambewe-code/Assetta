
/**
 * Calculates ZRA Turnover Tax / Income Tax based on provided rent and expenses.
 * 
 * @param grossRent Total rent collected in the period.
 * @param expenses Total allowable expenses (maintenance, etc.).
 * @returns Object containing taxable income and tax due.
 */
export const calculateTax = (grossRent: number, expenses: number) => {
    // 1. Expense Deduction
    // Ensure we don't go below zero for taxable income
    const taxableIncome = Math.max(0, grossRent - expenses);

    // 2. ZRA Tax Bands (Simplified for MVP)
    // Turnover Tax is typically 4% on gross, but if we are simulating
    // standard income tax filed annually, we use bands.
    // Requirement: "Gross rent slabs (4% <= K800,000/year, 12.5% >)"

    // Convert annual threshold to monthly for estimation: 800,000 / 12 = ~66,666.67
    const ANNUAL_THRESHOLD = 800000;
    // We assume the inputs are monthly for this utility, so we compare against monthly threshold
    // or we just calculate 'Projected Annual' tax. 
    // Let's implement strictly based on the user prompt: "4% <= K800,000/year, 12.5% >"

    // NOTE: This logic assumes 'grossRent' is the TOTAL context for the calculation period.
    // If it's a monthly return, we might need to project or track YTD. 
    // For MVP, we apply the rate flatly based on the amount passed (assuming it's the relevant total).

    const THRESHOLD = 800000;
    let taxDue = 0;
    let taxRate = '4%';

    if (grossRent <= THRESHOLD) {
        // 4% Turnover Tax logic
        taxDue = taxableIncome * 0.04;
        taxRate = '4%';
    } else {
        // 12.5% logic for amounts exceeding threshold
        // Simplification: Apply 4% on first 800k, 12.5% on rest? 
        // Or flat 12.5% if total exceeds? 
        // "12.5% >" implies the rate changes for the whole or the excess. 
        // Common tax behavior is progressive. 
        // Let's do: 4% on first 800k, 12.5% on the rest.

        // However, if it's Turnover Tax vs Income Tax, they are different regimes.
        // We will implement a Progressive Calculation for safety.

        const lowerBandTax = THRESHOLD * 0.04;
        const excess = taxableIncome - THRESHOLD;
        const upperBandTax = excess * 0.125;

        taxDue = lowerBandTax + upperBandTax;
        taxRate = 'Mixed (4% + 12.5%)';
    }

    return {
        grossRent,
        totalExpenses: expenses,
        taxableIncome,
        taxDue: parseFloat(taxDue.toFixed(2)),
        taxRate
    };
};
