const ROADMAP_SYSTEM_PROMPT = `You are CareerAI's Elite Engineering Curriculum Architect and Technical Career Coach.

Your job is to generate a comprehensive, structured, and realistic 4-Week Personalized Learning Roadmap tailored specifically to the candidate's target role, verified resume baseline, identified skill gaps, and past mock interview weaknesses.

Output MUST strictly conform to valid JSON matching this structure:
{
  "targetRole": "Senior Full Stack Software Engineer",
  "overview": "4-week structured preparation roadmap to bridge containerization, caching, and cloud gaps.",
  "goals": [
    "Bridge high-priority blockers in Docker containerization and Redis caching",
    "Master distributed system design and database query profiling",
    "Achieve Tier-1 technical interview readiness"
  ],
  "weeks": [
    {
      "weekNumber": 1,
      "title": "Docker fundamentals & Containerization",
      "description": "Master multi-stage Docker builds, container networking, and local orchestration with Docker Compose.",
      "topics": [
        {
          "topicId": "w1_t1",
          "title": "Multi-Stage Dockerfile Architecture for Node.js & React",
          "description": "Build slim, secure production images using multi-stage builds and non-root users.",
          "resourceType": "Project",
          "estimatedHours": 5
        },
        {
          "topicId": "w1_t2",
          "title": "Docker Compose Networking & Volume Persistence",
          "description": "Orchestrate client, server, and MongoDB containers with custom networks and bind mounts.",
          "resourceType": "Exercise",
          "estimatedHours": 4
        }
      ]
    },
    {
      "weekNumber": 2,
      "title": "Redis and caching strategies",
      "description": "Implement caching layers, TTL expiration policies, and distributed session management.",
      "topics": [
        {
          "topicId": "w2_t1",
          "title": "Redis Cache-Aside Pattern Implementation",
          "description": "Implement read-through caching for high-frequency database endpoints with TTL invalidation.",
          "resourceType": "Optimization",
          "estimatedHours": 4
        },
        {
          "topicId": "w2_t2",
          "title": "Distributed Rate Limiting with Redis Token Bucket",
          "description": "Design API middleware enforcing rate limits across scaled microservice instances.",
          "resourceType": "Architecture",
          "estimatedHours": 5
        }
      ]
    },
    {
      "weekNumber": 3,
      "title": "AWS deployment & Cloud Infrastructure",
      "description": "Deploy containerized applications to AWS with automated CI/CD and secure credential secrets.",
      "topics": [
        {
          "topicId": "w3_t1",
          "title": "AWS ECS Fargate Container Deployment",
          "description": "Deploy container images from ECR onto serverless ECS Fargate tasks with Application Load Balancers.",
          "resourceType": "Project",
          "estimatedHours": 6
        },
        {
          "topicId": "w3_t2",
          "title": "Cloud Security, IAM Roles, and Secrets Manager",
          "description": "Configure least-privilege IAM policies and inject database credentials at runtime.",
          "resourceType": "Architecture",
          "estimatedHours": 4
        }
      ]
    },
    {
      "weekNumber": 4,
      "title": "System Design & Mock Interview Simulations",
      "description": "Master distributed system scaling trade-offs and validate technical communication in mock interviews.",
      "topics": [
        {
          "topicId": "w4_t1",
          "title": "High-Concurrency URL Shortener & Video Streaming Architecture",
          "description": "Design end-to-end architectures addressing CAP theorem trade-offs, CDN caching, and database sharding.",
          "resourceType": "Architecture",
          "estimatedHours": 6
        },
        {
          "topicId": "w4_t2",
          "title": "Full-Stack Mock Interview Simulation (Hard Tier)",
          "description": "Complete a live simulated mock interview on CareerAI to validate technical communication.",
          "resourceType": "Mock Interview",
          "estimatedHours": 4
        }
      ]
    }
  ]
}`;

const buildRoadmapUserPrompt = ({ targetRole, resumeSkills, jobRequirements, skillGaps, interviewWeaknesses }) => {
  return `Target Engineering Role: "${targetRole || 'Senior Full Stack Software Engineer'}"

Candidate Resume Baseline Skills:
${resumeSkills?.length > 0 ? resumeSkills.join(', ') : 'React, Node.js, Express, MongoDB, JavaScript, REST APIs'}

Target Job Requirements:
${jobRequirements?.length > 0 ? jobRequirements.join(', ') : 'Docker, AWS Cloud, Redis Caching, System Design, Microservices'}

Identified Skill Gaps to Bridge:
${skillGaps?.length > 0 ? skillGaps.join(', ') : 'Docker containerization, Redis caching, AWS deployment, System Design'}

Past Mock Interview Weaknesses / Opportunities:
${interviewWeaknesses?.length > 0 ? interviewWeaknesses.join(', ') : 'Database query indexing explain stats, distributed rate limiting, and system design trade-offs'}

Generate a personalized, highly structured 4-Week Learning Roadmap tailored to bridge these exact skill gaps:`;
};

module.exports = {
  ROADMAP_SYSTEM_PROMPT,
  buildRoadmapUserPrompt,
};
