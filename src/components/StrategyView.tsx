import {
  BadgeDollarSign,
  BookOpen,
  Building2,
  HeartPulse,
  Key,
  Landmark,
  ShieldCheck,
} from 'lucide-react'

export function StrategyView() {
  return (
    <div className="strategy-stack">
      <div className="panel">
        <div className="panel-header">
          <div>
            <div className="panel-title-group">
              <BookOpen size={16} className="text-accent" />
              <h2 className="panel-title">
                Early Retirement Tax Shield &amp; Healthcare Playbook
              </h2>
            </div>
            <p className="panel-subtitle">
              Actionable IRS, 2027 GetCoveredNJ ACA, and NJ-1040 frameworks for penalty-free early
              access and near-zero effective tax rates
            </p>
          </div>
          <span className="status-tag">2026–2027 RULES</span>
        </div>

        <div className="strategy-grid">
          {/* Card 1 */}
          <div className="strategy-card">
            <div className="strategy-card-head">
              <div className="strategy-icon accent-blue">
                <Landmark size={16} />
              </div>
              <div>
                <div className="strategy-tag">ACCUMULATION PHASE</div>
                <h3>2026–2027 IRS Tax-Advantaged Limits</h3>
              </div>
            </div>
            <ul className="strategy-list">
              <li>
                <strong>401(k) Elective Deferral:</strong> <span>$24,500 / yr</span> (pre-tax shield
                saves ~30.3% combined Federal + NJ marginal tax).
              </li>
              <li>
                <strong>Mega Backdoor Roth (401k Total Cap):</strong> <span>$70,000 / yr</span>{' '}
                total employee + employer match + after-tax in-plan Roth conversion.
              </li>
              <li>
                <strong>HSA Individual Limit:</strong> <span>$4,400 / yr</span> (triple tax-free
                federally &amp; exempt from FICA; note NJ taxes HSA contributions &amp; earnings).
              </li>
              <li>
                <strong>Backdoor Roth IRA:</strong> <span>$7,500 / yr</span> via non-deductible
                Traditional IRA contribution + immediate Roth conversion (Form 8606).
              </li>
            </ul>
          </div>

          {/* Card 2 */}
          <div className="strategy-card">
            <div className="strategy-card-head">
              <div className="strategy-icon accent-green">
                <BadgeDollarSign size={16} />
              </div>
              <div>
                <div className="strategy-tag">FEDERAL TAX SHIELD</div>
                <h3>0% Federal Long-Term Capital Gains Harvester</h3>
              </div>
            </div>
            <ul className="strategy-list">
              <li>
                <strong>Standard Deduction (Single):</strong> <span>$16,100</span> of ordinary
                income or Roth conversion is taxed at <strong>0.0%</strong>.
              </li>
              <li>
                <strong>0% LTCG Bracket Ceiling:</strong> Up to <span>$49,450</span> of taxable
                income ($16,100 std deduction + $49,450 ={' '}
                <strong>$65,550 total gross income</strong>) pays <strong>$0 federal tax</strong> on
                long-term capital gains &amp; qualified dividends.
              </li>
              <li>
                <strong>Cost Basis Return:</strong> Selling $100k of brokerage ETFs where 65% is
                principal basis generates only <strong>$35,000 of reportable MAGI</strong>.
              </li>
            </ul>
          </div>

          {/* Card 3 */}
          <div className="strategy-card">
            <div className="strategy-card-head">
              <div className="strategy-icon accent-amber">
                <Key size={16} />
              </div>
              <div>
                <div className="strategy-tag">LIQUIDITY BRIDGE</div>
                <h3>Pre-Age 59½ Penalty-Free Access Ladder</h3>
              </div>
            </div>
            <ul className="strategy-list">
              <li>
                <strong>1. Taxable Brokerage Account:</strong> 100% liquid at any age with zero
                early withdrawal penalties; taxed only on realized long-term gains.
              </li>
              <li>
                <strong>2. Roth IRA Contribution Basis:</strong> Direct Roth IRA contributions and
                5-year seasoned conversions can be withdrawn <strong>tax- and penalty-free</strong>{' '}
                at any age.
              </li>
              <li>
                <strong>3. 5-Year Roth Conversion Ladder:</strong> Convert Traditional 401(k)/IRA to
                Roth inside the 0%/10%/12% brackets each year; principal unlocks penalty-free 5 tax
                years later.
              </li>
              <li>
                <strong>4. Rule 72(t) SEPP &amp; HSA Receipts:</strong> Substantially Equal Periodic
                Payments unlock IRA funds immediately; saved medical receipts unlock HSA tax-free.
              </li>
            </ul>
          </div>

          {/* Card 4 */}
          <div className="strategy-card">
            <div className="strategy-card-head">
              <div className="strategy-icon accent-purple">
                <HeartPulse size={16} />
              </div>
              <div>
                <div className="strategy-tag">HEALTHCARE OPTIMIZATION</div>
                <h3>2027 GetCoveredNJ ACA Subsidy Engineering</h3>
              </div>
            </div>
            <ul className="strategy-list">
              <li>
                <strong>No Asset Test:</strong> ACA Federal APTC &amp; New Jersey State Health Plan
                Savings depend <strong>100% on MAGI</strong>, never on total net worth.
              </li>
              <li>
                <strong>Tier 1 ($22k–$31k MAGI):</strong> Unlocks <strong>Silver CSR 94</strong> ($0
                deductible, ~$0/mo premium) or $0/mo Bronze HDHP.
              </li>
              <li>
                <strong>Tier 2 ($32k–$48k MAGI):</strong> Unlocks Subsidized Silver/Gold plans at{' '}
                <strong>$165–$320/mo</strong> ($1,980–$3,840/yr).
              </li>
              <li>
                <strong>MAGI Control Lever:</strong> Draw living cash from taxable basis + Roth
                basis (non-MAGI) while realizing just enough capital gains or Roth conversions to
                hit your target MAGI band.
              </li>
            </ul>
          </div>

          {/* Card 5 */}
          <div className="strategy-card">
            <div className="strategy-card-head">
              <div className="strategy-icon accent-green">
                <ShieldCheck size={16} />
              </div>
              <div>
                <div className="strategy-tag">SAMPLE PLAYBOOK</div>
                <h3>&ldquo;Spend $100k, Report $35k MAGI&rdquo; Blueprint</h3>
              </div>
            </div>
            <ul className="strategy-list">
              <li>
                <strong>Step 1 — Sell $80k Taxable ETFs (70% Basis):</strong> Generates{' '}
                <strong>$80,000 cash</strong>, but only <strong>$24,000</strong> is realized capital
                gain in MAGI.
              </li>
              <li>
                <strong>Step 2 — Withdraw $20k Roth Basis:</strong> Generates{' '}
                <strong>$20,000 cash</strong> with <strong>$0 MAGI impact</strong>.
              </li>
              <li>
                <strong>Step 3 — Portfolio Dividends ($11k):</strong> Adds $11,000 to MAGI, bringing
                total reported MAGI to <strong>$35,000</strong>.
              </li>
              <li>
                <strong>Result:</strong> <strong>$100,000 spendable cash</strong> ·{' '}
                <strong>$0 Federal Income Tax</strong> (100% inside 0% LTCG bracket) ·{' '}
                <strong>~$580 NJ State Tax</strong> · Qualifies for Tier 2 GetCoveredNJ ACA
                subsidies!
              </li>
            </ul>
          </div>

          {/* Card 6 */}
          <div className="strategy-card">
            <div className="strategy-card-head">
              <div className="strategy-icon accent-blue">
                <Building2 size={16} />
              </div>
              <div>
                <div className="strategy-tag">STATE TAX RULES</div>
                <h3>New Jersey NJ-1040 Early Retirement Nuances</h3>
              </div>
            </div>
            <ul className="strategy-list">
              <li>
                <strong>Progressive Low Brackets:</strong> NJ taxes the first $20k at{' '}
                <strong>1.4%</strong>, $20k–$35k at <strong>1.75%</strong>, and $35k–$40k at{' '}
                <strong>3.5%</strong> ($669 total tax on $35k taxable).
              </li>
              <li>
                <strong>Capital Gains Treatment:</strong> NJ taxes realized net capital gains at the
                same progressive rates as ordinary income (no separate LTCG table, but ultra-low
                bottom brackets).
              </li>
              <li>
                <strong>US Treasury Interest Exemption:</strong> Interest from US Treasury bills,
                notes, and bonds (or Treasury-only money market funds) is{' '}
                <strong>100% exempt from NJ state income tax</strong>.
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
