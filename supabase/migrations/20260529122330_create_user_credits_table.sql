
CREATE TABLE user_credits (
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    credit_balance INTEGER NOT NULL DEFAULT 0,
    daily_allotment_reset TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id)
);

ALTER TABLE user_credits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own credits." ON user_credits
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own credits." ON user_credits
  FOR UPDATE USING (auth.uid() = user_id);
