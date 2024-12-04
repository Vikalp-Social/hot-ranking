import baseServer from './base.js';

const ref = new Date(1/1/1970);

function score(date, likes, boosts){
    const d = new Date(date);
    const t = Math.floor(Math.abs(ref - d) / 1000);
    const x = likes + 2 * boosts;
    const y = x > 0 ? 1 : 0;
    const z = x >= 1 ? x : 1;
    return Math.log10(z) + (y * t / 45000);
}

function hotRanking(data){
    const statuses = data.map(status => {
        const s = status.reblog ? status.reblog : status;
        return {...status, score: score(s.created_at, s.favourites_count, s.reblogs_count)}
        
    });
    return statuses.sort((a, b) => b.score - a.score);
}

const app = baseServer(hotRanking);

const port = 3000;
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});