import { registerAs } from '@nestjs/config';
import { COOKIES_CONFIG_KEY } from '../../utils/constants';
import { env } from '../env/env';

export default registerAs(COOKIES_CONFIG_KEY, () => ({
  secret: env().COOKIES_SECRET,
}));
