/**
 * Settlement & Math Engine for Flexible N-Person Cost & Contri Splitter (INR ₹)
 */

export function calculateSummary(members, expenses, contri) {
  const memberStats = {};
  
  const targetPerMember = (contri && Number(contri.targetPerMember)) || 0;
  const contributions = (contri && contri.contributions) || {};

  // Initialize member stats dynamically for N members
  members.forEach(m => {
    const paidInPot = Number(contributions[m.id]) || 0;
    memberStats[m.id] = {
      member: m,
      outOfPocketPaid: 0,
      fairShareLiability: 0,
      contriPaid: paidInPot,
      contriTarget: targetPerMember,
      contriBalance: paidInPot - targetPerMember,
      projectExpenseNet: 0,
      contriNet: 0,
      netBalance: 0,
      paidExpensesCount: 0,
      categorySpending: {}
    };
  });

  let totalProjectCost = 0;
  let totalOutOfPocketSpent = 0;
  let totalContriSpent = 0;

  // Process all expenses
  expenses.forEach(exp => {
    const amount = Number(exp.amount) || 0;
    totalProjectCost += amount;

    // Track payer
    if (exp.paidBy === 'contri') {
      totalContriSpent += amount;
    } else if (memberStats[exp.paidBy]) {
      totalOutOfPocketSpent += amount;
      memberStats[exp.paidBy].outOfPocketPaid += amount;
      memberStats[exp.paidBy].paidExpensesCount += 1;
    }

    // Track split liabilities among participants (or default to all members if empty)
    const participants = (exp.participants && exp.participants.length > 0) 
      ? exp.participants 
      : members.map(m => m.id);

    if (participants.length > 0) {
      if (exp.splitType === 'custom' && exp.customSplits) {
        Object.entries(exp.customSplits).forEach(([mId, share]) => {
          if (memberStats[mId]) {
            const shareAmt = Number(share) || 0;
            memberStats[mId].fairShareLiability += shareAmt;
            addCategorySpending(memberStats[mId], exp.category, shareAmt);
          }
        });
      } else {
        // Equal split among participants
        const sharePerPerson = amount / participants.length;
        participants.forEach(mId => {
          if (memberStats[mId]) {
            memberStats[mId].fairShareLiability += sharePerPerson;
            addCategorySpending(memberStats[mId], exp.category, sharePerPerson);
          }
        });
      }
    }
  });

  // Calculate Net balances
  const totalTargetContri = targetPerMember * members.length;
  let totalContriCollected = 0;

  Object.values(memberStats).forEach(stat => {
    totalContriCollected += stat.contriPaid;
    // Project Net = Paid out of pocket - fair share liability
    stat.projectExpenseNet = stat.outOfPocketPaid - stat.fairShareLiability;
    
    // Contri Net = Paid into contri pot - target pot contribution (only if target is set > 0)
    if (targetPerMember > 0) {
      stat.contriNet = stat.contriPaid - stat.contriTarget;
    } else {
      // If no target is set, contri paid counts as out-of-pocket contribution towards pot
      stat.contriNet = stat.contriPaid;
    }

    // Combined Total Net = project expense net + contri net
    stat.netBalance = stat.projectExpenseNet + (targetPerMember > 0 ? stat.contriNet : 0);
  });

  const remainingContriPool = totalContriCollected - totalContriSpent;

  // Compute Optimal Settlements (Who owes whom)
  const settlements = computeOptimalSettlements(memberStats);

  return {
    totalProjectCost,
    totalOutOfPocketSpent,
    totalContriSpent,
    totalTargetContri,
    totalContriCollected,
    remainingContriPool,
    averageFairShare: members.length > 0 ? totalProjectCost / members.length : 0,
    memberStats,
    settlements
  };
}

function addCategorySpending(stat, category, amount) {
  const cat = category || 'misc';
  stat.categorySpending[cat] = (stat.categorySpending[cat] || 0) + amount;
}

/**
 * Min-Cash-Flow Algorithm to settle debts in minimum number of transactions
 */
export function computeOptimalSettlements(memberStats) {
  const creditors = []; // Owed money (> +0.01)
  const debtors = [];   // Owes money (< -0.01)

  Object.values(memberStats).forEach(stat => {
    const net = Math.round(stat.netBalance * 100) / 100;
    if (net > 0.01) {
      creditors.push({ id: stat.member.id, name: stat.member.name, avatar: stat.member.avatar, amount: net });
    } else if (net < -0.01) {
      debtors.push({ id: stat.member.id, name: stat.member.name, avatar: stat.member.avatar, amount: Math.abs(net) });
    }
  });

  // Sort descending by amount
  creditors.sort((a, b) => b.amount - a.amount);
  debtors.sort((a, b) => b.amount - a.amount);

  const transactions = [];
  let i = 0;
  let j = 0;

  while (i < debtors.length && j < creditors.length) {
    const debtor = debtors[i];
    const creditor = creditors[j];

    const payment = Math.min(debtor.amount, creditor.amount);
    const roundedPayment = Math.round(payment * 100) / 100;

    if (roundedPayment > 0) {
      transactions.push({
        id: `tx-${i}-${j}-${Date.now()}`,
        fromId: debtor.id,
        fromName: debtor.name,
        fromAvatar: debtor.avatar,
        toId: creditor.id,
        toName: creditor.name,
        toAvatar: creditor.avatar,
        amount: roundedPayment
      });
    }

    debtor.amount -= payment;
    creditor.amount -= payment;

    if (Math.abs(debtor.amount) < 0.01) i++;
    if (Math.abs(creditor.amount) < 0.01) j++;
  }

  return transactions;
}

/**
 * Indian Rupee (INR ₹) Currency Formatter
 */
export function formatCurrency(val) {
  const num = Number(val) || 0;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(num);
}
