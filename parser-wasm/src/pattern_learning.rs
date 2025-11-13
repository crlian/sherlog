use serde::{Serialize, Deserialize};

// ============================================================================
// TYPES
// ============================================================================

/// Detected pattern from user examples
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DetectedPattern {
    pub template: String,           // "User {VAR} not found"
    pub regex: String,              // r"User .+ not found"
    pub confidence: f32,            // 0.0 - 1.0
    pub variable_segments: Vec<String>,  // Extracted variable values
    pub common_parts: Vec<String>,  // Static parts of the template
}

// ============================================================================
// LCS (Longest Common Subsequence) Implementation
// ============================================================================

/// Compute Longest Common Subsequence between two strings
fn lcs_two_strings(a: &str, b: &str) -> String {
    let a_chars: Vec<char> = a.chars().collect();
    let b_chars: Vec<char> = b.chars().collect();
    let m = a_chars.len();
    let n = b_chars.len();

    // DP table for LCS length
    let mut dp = vec![vec![0; n + 1]; m + 1];

    // Fill DP table
    for i in 1..=m {
        for j in 1..=n {
            if a_chars[i - 1] == b_chars[j - 1] {
                dp[i][j] = dp[i - 1][j - 1] + 1;
            } else {
                dp[i][j] = dp[i - 1][j].max(dp[i][j - 1]);
            }
        }
    }

    // Backtrack to build LCS
    let mut lcs = String::new();
    let mut i = m;
    let mut j = n;

    while i > 0 && j > 0 {
        if a_chars[i - 1] == b_chars[j - 1] {
            lcs.insert(0, a_chars[i - 1]);
            i -= 1;
            j -= 1;
        } else if dp[i - 1][j] > dp[i][j - 1] {
            i -= 1;
        } else {
            j -= 1;
        }
    }

    lcs
}

/// Compute LCS for multiple strings
fn compute_multi_lcs(strings: &[String]) -> String {
    if strings.is_empty() {
        return String::new();
    }

    if strings.len() == 1 {
        return strings[0].clone();
    }

    let mut result = strings[0].clone();

    for s in &strings[1..] {
        result = lcs_two_strings(&result, s);

        // If LCS becomes too short, stop
        if result.len() < 5 {
            break;
        }
    }

    result
}

// ============================================================================
// Levenshtein Distance Implementation
// ============================================================================

/// Calculate Levenshtein distance between two strings
pub fn levenshtein_distance(a: &str, b: &str) -> usize {
    let a_chars: Vec<char> = a.chars().collect();
    let b_chars: Vec<char> = b.chars().collect();
    let m = a_chars.len();
    let n = b_chars.len();

    // Handle empty strings
    if m == 0 {
        return n;
    }
    if n == 0 {
        return m;
    }

    let mut dp = vec![vec![0; n + 1]; m + 1];

    // Initialize first row and column
    for i in 0..=m {
        dp[i][0] = i;
    }
    for j in 0..=n {
        dp[0][j] = j;
    }

    // Fill DP table
    for i in 1..=m {
        for j in 1..=n {
            let cost = if a_chars[i - 1] == b_chars[j - 1] { 0 } else { 1 };

            dp[i][j] = (dp[i - 1][j] + 1)           // deletion
                .min(dp[i][j - 1] + 1)              // insertion
                .min(dp[i - 1][j - 1] + cost);      // substitution
        }
    }

    dp[m][n]
}

/// Calculate similarity score (0.0 - 1.0) based on Levenshtein distance
pub fn similarity_score(a: &str, b: &str) -> f32 {
    let distance = levenshtein_distance(a, b);
    let max_len = a.len().max(b.len());

    if max_len == 0 {
        return 1.0;
    }

    1.0 - (distance as f32 / max_len as f32)
}

// ============================================================================
// Pattern Detection
// ============================================================================

/// Detect pattern from multiple example strings
pub fn detect_pattern_lcs(examples: &[String]) -> Option<DetectedPattern> {
    if examples.len() < 2 {
        return None;
    }

    // Remove duplicates
    let mut unique_examples: Vec<String> = examples.to_vec();
    unique_examples.sort();
    unique_examples.dedup();

    if unique_examples.len() < 2 {
        return None;
    }

    // Find LCS of all examples
    let lcs = compute_multi_lcs(&unique_examples);

    // LCS must be at least 10% of average length
    let avg_len = unique_examples.iter().map(|s| s.len()).sum::<usize>() / unique_examples.len();
    if lcs.len() < (avg_len / 10).max(3) {
        return None;
    }

    // Build template by replacing variable parts with {VAR}
    let template = build_template_from_lcs(&lcs, &unique_examples[0]);

    // Extract variable segments
    let variable_segments = extract_variable_segments(&unique_examples, &lcs);

    // Generate regex pattern
    let regex = build_regex_from_template(&template);

    // Calculate confidence based on:
    // 1. How much of the string is common (LCS ratio)
    // 2. How consistent the examples are (similarity)
    let confidence = calculate_confidence(&unique_examples, &lcs);

    // SAFETY CHECK: Reject patterns with very low confidence
    if confidence < 0.5 {
        return None;
    }

    Some(DetectedPattern {
        template,
        regex,
        confidence,
        variable_segments,
        common_parts: split_by_lcs(&lcs),
    })
}

/// Build template from LCS and first example
fn build_template_from_lcs(lcs: &str, example: &str) -> String {
    if lcs.is_empty() {
        return "{VAR}".to_string();
    }

    let mut template = example.to_string();
    let lcs_chars: Vec<char> = lcs.chars().collect();
    let example_chars: Vec<char> = example.chars().collect();

    // Find positions where LCS matches
    let mut lcs_idx = 0;
    let mut in_variable = false;
    let mut result = String::new();

    for ch in example_chars {
        if lcs_idx < lcs_chars.len() && ch == lcs_chars[lcs_idx] {
            if in_variable {
                result.push_str("{VAR}");
                in_variable = false;
            }
            result.push(ch);
            lcs_idx += 1;
        } else {
            in_variable = true;
        }
    }

    if in_variable {
        result.push_str("{VAR}");
    }

    // Clean up multiple {VAR} in a row
    while result.contains("{VAR}{VAR}") {
        result = result.replace("{VAR}{VAR}", "{VAR}");
    }

    result
}

/// Extract variable segments from examples
fn extract_variable_segments(examples: &[String], lcs: &str) -> Vec<String> {
    let mut segments = Vec::new();

    for example in examples {
        // Find parts that are NOT in LCS
        let mut current_segment = String::new();
        let lcs_chars: Vec<char> = lcs.chars().collect();
        let example_chars: Vec<char> = example.chars().collect();
        let mut lcs_idx = 0;

        for ch in example_chars {
            if lcs_idx < lcs_chars.len() && ch == lcs_chars[lcs_idx] {
                if !current_segment.is_empty() {
                    segments.push(current_segment.clone());
                    current_segment.clear();
                }
                lcs_idx += 1;
            } else {
                current_segment.push(ch);
            }
        }

        if !current_segment.is_empty() {
            segments.push(current_segment);
        }
    }

    segments.sort();
    segments.dedup();
    segments
}

/// Build regex from template
fn build_regex_from_template(template: &str) -> String {
    // Escape special regex characters except {VAR}
    let mut regex = regex::escape(template);

    // Replace {VAR} with a non-greedy match that allows zero or more characters
    // Use .*? instead of .+? to allow empty matches
    regex = regex.replace(r"\{VAR\}", ".*?");

    // Make it match the whole line
    format!("^{}$", regex)
}

/// Split LCS into common parts
fn split_by_lcs(lcs: &str) -> Vec<String> {
    lcs.split_whitespace()
        .map(|s| s.to_string())
        .filter(|s| !s.is_empty())
        .collect()
}

/// Calculate confidence score for pattern detection
fn calculate_confidence(examples: &[String], lcs: &str) -> f32 {
    if examples.is_empty() || lcs.is_empty() {
        return 0.0;
    }

    // Factor 1: LCS coverage (how much of each string is common)
    let avg_length = examples.iter().map(|s| s.len()).sum::<usize>() as f32 / examples.len() as f32;
    let lcs_coverage = lcs.len() as f32 / avg_length;

    // Factor 2: Pairwise similarity (how similar are the examples to each other)
    let mut total_similarity = 0.0;
    let mut count = 0;

    for i in 0..examples.len() {
        for j in (i + 1)..examples.len() {
            total_similarity += similarity_score(&examples[i], &examples[j]);
            count += 1;
        }
    }

    let avg_similarity = if count > 0 {
        total_similarity / count as f32
    } else {
        0.0
    };

    // Factor 3: Penalty for very short LCS
    let length_penalty = if lcs.len() < 5 {
        0.5
    } else {
        1.0
    };

    // Combine factors (weighted average)
    let confidence = (lcs_coverage * 0.5 + avg_similarity * 0.5) * length_penalty;

    // Clamp to [0, 1]
    confidence.min(1.0).max(0.0)
}

// ============================================================================
// Clustering
// ============================================================================

/// Cluster errors by similarity threshold
pub fn cluster_by_similarity(errors: &[String], threshold: f32) -> Vec<Vec<String>> {
    let mut clusters: Vec<Vec<String>> = Vec::new();

    for error in errors {
        let mut found = false;

        for cluster in &mut clusters {
            let centroid = &cluster[0];
            let similarity = similarity_score(error, centroid);

            if similarity >= threshold {
                cluster.push(error.clone());
                found = true;
                break;
            }
        }

        if !found {
            clusters.push(vec![error.clone()]);
        }
    }

    clusters
}

// ============================================================================
// Tests
// ============================================================================

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_lcs() {
        let result = lcs_two_strings("User 123 not found", "User 456 not found");
        assert!(result.contains("User"));
        assert!(result.contains("not found"));
    }

    #[test]
    fn test_levenshtein() {
        assert_eq!(levenshtein_distance("kitten", "sitting"), 3);
        assert_eq!(levenshtein_distance("", ""), 0);
        assert_eq!(levenshtein_distance("abc", "abc"), 0);
    }

    #[test]
    fn test_pattern_detection() {
        let examples = vec![
            "User 12345 not found".to_string(),
            "User 67890 not found".to_string(),
            "User 99999 not found".to_string(),
        ];

        let pattern = detect_pattern_lcs(&examples);
        assert!(pattern.is_some());

        let p = pattern.unwrap();
        assert!(p.template.contains("{VAR}"));
        assert!(p.confidence > 0.7);
    }
}
