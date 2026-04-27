use biblatex::Bibliography;
fn main() {
    let src = "@book{test, title={A Book}, author={Mariano, Roberto S. and Schuermann, Til and Weeks, Melvyn J}, publisher={Press}}";
    let bib = Bibliography::parse(src).unwrap();
    let entry = bib.iter().next().unwrap();
    
    // We want to extract authors as: "Roberto S. Mariano; Til Schuermann; Melvyn J Weeks"
    let author_persons = match entry.author() {
        Ok(persons) => {
            let mut names = Vec::new();
            for person in persons {
                let first = person.given_name;
                let last = person.name;
                let mut full = String::new();
                if !first.is_empty() {
                    full.push_str(&first);
                    full.push(' ');
                }
                full.push_str(&last);
                names.push(full.trim().to_string());
            }
            names.join("; ")
        },
        _ => String::new(),
    };
    println!("Formatted Authors: {}", author_persons);
}
