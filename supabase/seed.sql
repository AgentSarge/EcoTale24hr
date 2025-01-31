-- Insert initial eco tasks (these will be associated with users when they sign up)
insert into public.eco_tasks (title, description, points, user_id)
values
    ('Plant a Tree', 'Plant a tree in your local area to help combat climate change and improve air quality.', 50, '00000000-0000-0000-0000-000000000000'),
    ('Start Composting', 'Set up a composting system at home to reduce waste and create nutrient-rich soil.', 30, '00000000-0000-0000-0000-000000000000'),
    ('Use Reusable Bags', 'Replace single-use plastic bags with reusable shopping bags for all your shopping trips.', 10, '00000000-0000-0000-0000-000000000000'),
    ('Install LED Bulbs', 'Replace traditional light bulbs with energy-efficient LED bulbs throughout your home.', 20, '00000000-0000-0000-0000-000000000000'),
    ('Start a Garden', 'Create a small vegetable garden to grow your own organic produce.', 40, '00000000-0000-0000-0000-000000000000'),
    ('Zero Waste Day', 'Go an entire day without producing any waste that goes to landfill.', 25, '00000000-0000-0000-0000-000000000000'),
    ('Public Transport Week', 'Use public transportation or bike instead of driving for a whole week.', 35, '00000000-0000-0000-0000-000000000000'),
    ('Energy Audit', 'Conduct an energy audit of your home and identify areas for improvement.', 15, '00000000-0000-0000-0000-000000000000'),
    ('Water Conservation', 'Install water-saving devices in your home (low-flow showerheads, faucet aerators).', 25, '00000000-0000-0000-0000-000000000000'),
    ('Recycling System', 'Set up a comprehensive recycling system at home with separate bins for different materials.', 20, '00000000-0000-0000-0000-000000000000'); 