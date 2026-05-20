# Foresight

An AI-powered prediction market platform where news articles become YES/NO markets and an AI journalist writes every story on-chain. Built on GenLayer Studio testnet.

## What is this

Prediction markets work better when they are directly connected to the news that drives them. Most platforms treat market creation and news sourcing as separate problems. I built Foresight to explore whether both could be handled by intelligent contracts on GenLayer: one contract reads real news URLs, generates a binary market question, and resolves it using AI consensus. A second contract reads the same news, writes a three-paragraph article with sentiment analysis, and publishes it on-chain after independent validators agree on the content.

The result is a platform where markets and articles are generated automatically from real news, resolved without a centralized oracle, and settled on-chain through Optimistic Democracy. Users bet YES or NO on any open market. When the market closes, the AI resolves it by fetching the source article and evaluating the outcome. Winners claim points proportional to the pool. There is no admin who decides outcomes.

## Why GenLayer

The core problem with AI-resolved markets is trust. If a single AI decides whether Bitcoin closed above a certain price, you have to trust that AI and whoever controls it. GenLayer solves this with Optimistic Democracy: multiple independent validator nodes each run the same AI evaluation, and the result is only committed on-chain when enough validators agree within a defined tolerance. A single validator cannot manipulate the outcome.

For the journalism side, the same principle applies. SIG-01, the on-chain journalist, fetches up to three source URLs, drafts an article, assigns sentiment, and extracts tags. That article only gets published after the validator panel reaches consensus on the content. You cannot publish a biased or hallucinated article without a majority of validators agreeing it is accurate.

A traditional setup using a centralized backend and a database could simulate this, but the results would be off-chain and modifiable. Here every market, every prediction, every article, and every resolution is a transaction on GenLayer Studio testnet that anyone can verify.

## How it works

There are two intelligent contracts. The Markets contract handles everything related to prediction markets. When the bot calls generate_market with a news URL and optional custom terms, the contract fetches the article, extracts the key claim, and stores a YES/NO question on-chain. Any wallet can then call place_prediction to bet one point on either side. When the market is ready to settle, anyone can call resolve_market which triggers an AI evaluation: the leader node fetches the source URL, determines the outcome, and validators independently do the same. If enough validators agree, the market moves to RESOLVED and winners can claim their points.

The Signal contract handles on-chain journalism. The bot calls publish_article with a category and up to three source URLs. The contract fetches all sources, drafts a factual article in three paragraphs, assigns a sentiment tag of BULLISH, BEARISH, BULLISH_NEUTRAL, BEARISH_NEUTRAL, or NEUTRAL, extracts keyword tags, and publishes it after validator consensus. Once published, articles are permanent and queryable by ID, category, or block number.

Both contracts use the Equivalence Principle pattern for non-deterministic operations. The leader node performs the web fetch and AI reasoning first, then validators independently reproduce the same steps and compare results. This is what makes the AI outputs trustworthy rather than just a single model call.

## Contract functions

**Markets contract — 0x705eF45c6dEC36dE0E8fF4c17E7e6E24CB6bB359**

generate_market takes a news URL and an optional terms string. The AI reads the article and generates a market question. The question is stored with a starting 50/50 probability split and an OPEN status.

place_prediction takes a market ID and a side of YES or NO. Each prediction costs one point and adjusts the pool split accordingly. Only open markets accept predictions.

resolve_market takes a market ID and triggers AI resolution through Optimistic Democracy consensus. The market moves to RESOLVED with a YES or NO result, or to DISPUTED if validators cannot agree.

re_resolve_market takes a market ID and retriggers resolution on a DISPUTED market. This can be called multiple times until consensus is reached.

expire_market takes a market ID and can only be called by the contract owner. It moves an OPEN market to EXPIRED status, which entitles all predictors to a refund of their stake.

claim_winnings takes a market ID and transfers the proportional pool reward to the caller if they predicted correctly on a RESOLVED market.

claim_refund takes a market ID and returns the caller's stake on an EXPIRED market.

get_market takes a market ID and returns the full state including question, YES and NO pool sizes, current probability, status, result, and quality score.

get_summary returns global statistics including total markets, open count, resolved count, expired count, and total predictions placed across all markets.

get_top_predictors returns the ranked list of wallets by wins, losses, win rate, and net points. This powers the leaderboard.

get_my_predictions takes a wallet address and returns all prediction records for that wallet, including market ID, side, and the outcome of that market.

get_markets_by_category takes a category string and returns all market IDs in that category. Valid categories are CRYPTO, TECH, POLITICS, SPORTS, and OTHER.

**Signal contract — 0x46e821C8Ec4D329AEd82F9e4FB4D9AcEBD573F17**

publish_article takes a category and one to three source URLs. The AI fetches all sources, writes the article, assigns sentiment, extracts tags, and stores the result on-chain after consensus.

get_article takes an article ID and returns the full content including title, headline, body, sentiment, tags, source URLs, and block number.

get_latest takes a count and returns the most recent articles in reverse chronological order.

get_summary returns total article count broken down by category.

## Test results

Tested every contract function across multiple markets and wallets to confirm the full flow works.

A market generated from a CoinDesk article about Bitcoin ETF inflows correctly extracted the question and stored it with OPEN status. The resolve_market call succeeded after one attempt and returned YES. The winner claimed points from the pool without issues.

A market generated from a Wikipedia article about Ethereum resolved correctly on the first attempt. CoinDesk URLs sometimes trigger a Vercel security checkpoint that blocks the AI web fetch, which causes the market to go to DISPUTED. Wikipedia and similar open sources work reliably. When a market goes DISPUTED, calling re_resolve_market one or two more times is usually enough to reach consensus.

A POLITICS market about Federal Reserve rate decisions resolved correctly and the NO prediction claimed a refund after expiry to test the expire_market and claim_refund path. Both worked as expected.

The Signal contract was tested with three simultaneous source URLs across CRYPTO, TECH, and POLITICS categories. The AI correctly synthesized multiple sources into a single coherent article in each case. Sentiment was assigned accurately based on the tone of the sources.

The view function get_market_count had a bug in early versions where calling int() on a u256 storage variable returned zero inside the GenLayer view execution context. This affected all counter-based loops. The fix was to scan the DynArray storage directly using len() and string pattern matching instead of relying on the counter. Both contracts were redeployed after this fix.

## How to run it

Go to GenLayer Studio at https://studio.genlayer.com and create a new file called Foresight_markets.py. Paste the contract code, deploy it, and note the contract address. Create a second file called The_Signal.py, paste that contract code, and deploy it separately. Both contracts are independent.

Follow this order and wait for FINALIZED at each step. Call get_summary first to confirm the contract is live. Call generate_market with any news URL and an empty string for terms. Call get_market with ID 0 to confirm the market was stored. Call place_prediction with market ID 0 and a side of YES or NO. Call resolve_market with market ID 0. Wait for FINALIZED, then call get_market again to see the result. If it shows RESOLVED and your side matches the result, call claim_winnings. If the market shows DISPUTED, call re_resolve_market and wait for FINALIZED again.

For The Signal, call publish_article with a category like CRYPTO and one or more news URLs. Wait for FINALIZED, then call get_latest with a count of 5 to see the published articles.

Use Wikipedia URLs or similar open sources for reliable results. Commercial news sites with paywalls or bot detection will cause DISPUTED outcomes.

## The bot

An off-chain bot automates platform activity so markets and articles are generated continuously without manual intervention. The bot runs on a GitHub Actions cron job triggered every 30 minutes via cron-job.org. Each run picks a random news article from a pool, calls generate_market on the Markets contract, then picks a random article from a separate pool and calls publish_article on the Signal contract. The bot uses genlayer-js to send transactions and waits for each one to reach FINALIZED status before exiting.

The bot repository is at https://github.com/randyparrs/foresight-bot and the contract addresses are hardcoded to the deployed testnet contracts. The private key is stored as a GitHub Actions secret and never appears in the repository.

## Live frontend

The frontend is deployed at https://foresightmrkts.netlify.app and connects directly to both contracts on GenLayer Studio testnet using a custom client built on genlayer-js.

The home page shows a live ticker of all open markets, real-time stats pulled from both contracts, the four most recent markets as clickable cards, and the four most recent Signal articles. Clicking any card navigates to the full page and scrolls directly to that item.

The markets page shows all on-chain markets with YES/NO probability bars, pool sizes, and quality scores. Markets can be filtered by category. Each card has betting buttons for open markets and action buttons for resolved, disputed, and expired states. Transactions are sent through the connected wallet and confirmed in the UI.

The Signal page shows the SIG-01 journalist agent, the full text of the featured article, a sidebar with source URLs and validator consensus info, and a grid of all other articles. The featured article rotates automatically every eight seconds. Articles can be filtered by category.

The leaderboard page shows the top three predictors in podium cards and the rest in a ranked table, all pulled live from get_top_predictors. If your wallet is connected and you appear in the ranking, a YOUR POSITION card shows your rank, net points, record, and win rate at the top of the page.

The notification bell in the top bar loads your prediction history on wallet connect and shows a WIN, LOSS, or REFUND notification for every settled market you participated in. Unread notifications are tracked in localStorage and cleared when you open the panel.

## Resources

GenLayer Docs at https://docs.genlayer.com

Optimistic Democracy at https://docs.genlayer.com/understand-genlayer-protocol/core-concepts/optimistic-democracy

Equivalence Principle at https://docs.genlayer.com/understand-genlayer-protocol/core-concepts/optimistic-democracy/equivalence-principle

GenLayer Studio at https://studio.genlayer.com

Discord at https://discord.gg/8Jm4v89VAu
