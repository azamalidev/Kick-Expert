-- Set up credit purchase tables and functions
-- This should be run after the basic profile setup

-- Create credit_purchases table if it doesn't exist
create table if not exists credit_purchases (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid references profiles(id) not null,
    amount decimal not null,
    credits integer not null,
    payment_provider text not null,
    payment_id text,
    payment_data jsonb,
    status text not null default 'pending',
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);

-- Create function to process credit purchase
create or replace function process_credit_purchase(
    p_purchase_id uuid,
    p_user_id uuid,
    p_credits integer,
    p_payment_data jsonb
)
returns jsonb
language plpgsql
security definer
as $$
declare
    v_purchase record;
    v_result jsonb;
begin
    -- Get the purchase record and lock it
    select * into v_purchase
    from credit_purchases
    where id = p_purchase_id
    and user_id = p_user_id
    and status = 'pending'
    for update;

    if not found then
        raise exception 'Invalid or already processed purchase';
    end if;

    -- Update purchase status
    update credit_purchases
    set status = 'completed',
        payment_data = p_payment_data,
        updated_at = now()
    where id = p_purchase_id;

    -- Update user's credit balance
    update profiles
    set purchased_credits = coalesce(purchased_credits, 0) + p_credits,
        updated_at = now()
    where id = p_user_id;

    -- Return success result
    v_result := json_build_object(
        'success', true,
        'purchase_id', p_purchase_id,
        'credits_added', p_credits
    );

    return v_result;
exception
    when others then
        -- Log error and return failure
        raise notice 'Error in process_credit_purchase: %', sqlerrm;
        return json_build_object(
            'success', false,
            'error', sqlerrm
        );
end;
$$;
