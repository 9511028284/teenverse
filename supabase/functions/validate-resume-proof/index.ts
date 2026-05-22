const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const allowedDomains = new Set([
  'github.com',
  'www.github.com',
  'behance.net',
  'www.behance.net',
  'dribbble.com',
  'www.dribbble.com',
  'figma.com',
  'www.figma.com',
  'linkedin.com',
  'www.linkedin.com',
  'vercel.app',
  'netlify.app',
  'youtube.com',
  'www.youtube.com',
]);

const readTitle = (html: string) => {
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  return titleMatch?.[1]?.replace(/\s+/g, ' ').trim() || null;
};

const normalizeHandle = (value: string | null | undefined) => {
  if (!value) return null;

  try {
    const parsed = new URL(value);
    const [, handle] = parsed.pathname.split('/');
    return handle?.toLowerCase() || null;
  } catch {
    return value.replace(/^@/, '').trim().toLowerCase() || null;
  }
};

const readGithubMetadata = async (url: URL) => {
  const [, owner, repo] = url.pathname.split('/');
  if (!owner || !repo) return {};

  const response = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
    headers: { accept: 'application/vnd.github+json' },
  });

  if (!response.ok) {
    return { github_owner: owner, github_repo: repo, github_status: response.status };
  }

  const repoData = await response.json();
  return {
    github_owner: repoData.owner?.login || owner,
    github_repo: repoData.name || repo,
    github_description: repoData.description || null,
    github_stars: repoData.stargazers_count || 0,
    github_forks: repoData.forks_count || 0,
    github_default_branch: repoData.default_branch || null,
  };
};

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { expectedGithubUsername, proofUrl } = await request.json();
    const url = new URL(String(proofUrl || '').trim());
    const hostname = url.hostname.toLowerCase();

    if (!['http:', 'https:'].includes(url.protocol)) {
      return Response.json(
        { valid: false, reason: 'Proof URL must use http or https.' },
        { status: 400, headers: corsHeaders },
      );
    }

    if (!allowedDomains.has(hostname)) {
      return Response.json(
        { valid: false, reason: 'Proof domain is not trusted yet.', domain: hostname },
        { status: 400, headers: corsHeaders },
      );
    }

    const expectedGithubOwner = normalizeHandle(expectedGithubUsername);
    const isGithubProof = hostname === 'github.com' || hostname === 'www.github.com';
    const githubPathOwner = isGithubProof ? normalizeHandle(url.pathname.split('/')[1]) : null;

    if (isGithubProof && !expectedGithubOwner) {
      return Response.json(
        {
          valid: false,
          reason: 'Add your GitHub profile to your TeenVerse profile before using GitHub proof.',
          domain: hostname,
          ownershipVerified: false,
        },
        { status: 400, headers: corsHeaders },
      );
    }

    if (isGithubProof && githubPathOwner && expectedGithubOwner !== githubPathOwner) {
      return Response.json(
        {
          valid: false,
          reason: `GitHub proof owner "${githubPathOwner}" does not match profile owner "${expectedGithubOwner}".`,
          domain: hostname,
          ownershipVerified: false,
          metadata: {
            expected_github_owner: expectedGithubOwner,
            proof_github_owner: githubPathOwner,
          },
        },
        { status: 400, headers: corsHeaders },
      );
    }

    const proofResponse = await fetch(url.toString(), {
      method: 'GET',
      redirect: 'follow',
      headers: {
        'user-agent': 'TeenVerseProofValidator/1.0',
      },
    });

    const contentType = proofResponse.headers.get('content-type') || '';
    const body = contentType.includes('text/html') ? await proofResponse.text() : '';
    const metadata = {
      title: body ? readTitle(body) : null,
      content_type: contentType,
      final_url: proofResponse.url,
      ownership_verified: isGithubProof ? Boolean(expectedGithubOwner && githubPathOwner === expectedGithubOwner) : false,
      expected_github_owner: expectedGithubOwner,
      ...(hostname.includes('github.com') ? await readGithubMetadata(url) : {}),
    };

    return Response.json(
      {
        valid: proofResponse.ok,
        reason: proofResponse.ok ? null : `Proof URL returned HTTP ${proofResponse.status}.`,
        normalizedUrl: url.toString(),
        domain: hostname,
        httpStatus: proofResponse.status,
        ownershipVerified: metadata.ownership_verified,
        metadata,
      },
      { status: proofResponse.ok ? 200 : 400, headers: corsHeaders },
    );
  } catch (error) {
    return Response.json(
      { valid: false, reason: error instanceof Error ? error.message : 'Invalid proof URL.' },
      { status: 400, headers: corsHeaders },
    );
  }
});
