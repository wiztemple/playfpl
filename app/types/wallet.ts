export interface PaymentData {
    leagueId: string;
    fplTeamId: string;
    amount: number;
    email?: string;
    name?: string;
    metadata?: {
        league_name?: string;
        gameweek?: number;
        team_name?: string;
        [key: string]: any;
    };
}
